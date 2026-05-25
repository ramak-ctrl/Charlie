import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";
import { analyzeInterview } from "@/lib/anthropic";
import type { ScreeningQuestion } from "@/lib/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ interviewId: string }> }) {
  const { interviewId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = await createServiceClient();

  const { data: interview } = await serviceClient
    .from("interviews")
    .select("*, candidates(id), jobs!inner(created_by)")
    .eq("id", interviewId)
    .single();

  if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((interview.jobs as { created_by: string }).created_by !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!interview.retell_call_id) {
    return NextResponse.json({ error: "No call ID on this interview" }, { status: 422 });
  }

  const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! });
  let callData: Record<string, unknown>;
  try {
    callData = await retell.call.retrieve(interview.retell_call_id) as unknown as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Failed to fetch call from Retell" }, { status: 502 });
  }

  const transcriptObject = (callData.transcript_object as { role: string; content: string }[]) ?? [];
  const durationMs = callData.duration_ms as number | undefined;
  const recordingUrl = (callData.recording_url as string | undefined) ?? null;

  await serviceClient
    .from("interviews")
    .update({
      status: "completed",
      transcript: transcriptObject,
      recording_url: recordingUrl,
      duration_secs: durationMs ? Math.floor(durationMs / 1000) : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", interviewId);

  const candidateId = (interview.candidates as { id: string }).id;
  await serviceClient.from("candidates").update({ status: "completed" }).eq("id", candidateId);

  if (transcriptObject.length === 0) {
    return NextResponse.json({ synced: true, analyzed: false, reason: "No transcript yet — call may still be processing" });
  }

  // Check if evaluation already exists
  const { data: existing } = await serviceClient
    .from("evaluations")
    .select("id")
    .eq("interview_id", interviewId)
    .single();

  if (existing) {
    return NextResponse.json({ synced: true, analyzed: true, reason: "Already analyzed" });
  }

  try {
    const { data: fullInterview } = await serviceClient
      .from("interviews")
      .select("*, jobs(title, key_skills, screening_questions(*))")
      .eq("id", interviewId)
      .single();

    const jobData = (fullInterview!.jobs as { title: string; key_skills: string[]; screening_questions: ScreeningQuestion[] });
    const result = await analyzeInterview({
      transcript: transcriptObject as { role: "agent" | "user"; content: string }[],
      job: { title: jobData.title, key_skills: jobData.key_skills },
      screeningQuestions: jobData.screening_questions ?? [],
    });
    await serviceClient.from("evaluations").insert({ interview_id: interviewId, ...result });
    return NextResponse.json({ synced: true, analyzed: true });
  } catch (err) {
    console.error("[sync] analysis failed:", err);
    return NextResponse.json({ synced: true, analyzed: false, reason: "Analysis failed" });
  }
}
