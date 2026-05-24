import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";

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

  const transcript = (callData.transcript as { role: string; content: string }[]) ?? [];
  const durationMs = callData.duration_ms as number | undefined;
  const recordingUrl = (callData.recording_url as string | undefined) ?? null;

  await serviceClient
    .from("interviews")
    .update({
      status: "completed",
      transcript,
      recording_url: recordingUrl,
      duration_secs: durationMs ? Math.floor(durationMs / 1000) : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", interviewId);

  const candidateId = (interview.candidates as { id: string }).id;
  await serviceClient.from("candidates").update({ status: "completed" }).eq("id", candidateId);

  if (transcript.length === 0) {
    return NextResponse.json({ synced: true, analyzed: false, reason: "No transcript yet — call may still be processing" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const analyzeRes = await fetch(`${appUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interview_id: interviewId }),
    });
    const analyzeData = await analyzeRes.json();
    return NextResponse.json({ synced: true, analyzed: analyzeRes.ok, result: analyzeData });
  } catch {
    return NextResponse.json({ synced: true, analyzed: false, reason: "Analysis failed" });
  }
}
