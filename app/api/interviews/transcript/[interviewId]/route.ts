import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { analyzeInterview } from "@/lib/anthropic";
import type { ScreeningQuestion, TranscriptEntry } from "@/lib/types";
import { getSetting } from "@/lib/settings";
import { z } from "zod";

// Receives the interview transcript from the Groq/Pipecat bot (bot.py) when a call ends,
// then runs Charlie's own analysis — the Pipecat equivalent of the Retell webhook.

const BodySchema = z.object({
  interview_id: z.string().nullable().optional(),
  transcript: z.array(
    z.object({
      role: z.enum(["agent", "user"]),
      content: z.string(),
    })
  ),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ interviewId: string }> }) {
  const { interviewId } = await params;

  // Optional shared-secret check (set BOT_WEBHOOK_SECRET to enforce)
  const expectedSecret = await getSetting("BOT_WEBHOOK_SECRET");
  if (expectedSecret) {
    const provided = request.headers.get("x-bot-secret") ?? "";
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const transcript = parsed.data.transcript as TranscriptEntry[];

  const supabase = await createServiceClient();

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, candidate_id, status")
    .eq("id", interviewId)
    .single();

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  // A call that produced no real conversation (candidate dropped, broken mic, only
  // the greeting) should NOT be recorded as a genuine "completed" interview — that
  // makes an abandoned attempt indistinguishable from a finished one in the
  // dashboard. Mark it "no_show" and leave the candidate at "started" instead.
  const hasRealConversation = transcript.length > 2;

  await supabase
    .from("interviews")
    .update({
      status: hasRealConversation ? "completed" : "no_show",
      transcript,
      completed_at: new Date().toISOString(),
    })
    .eq("id", interview.id);

  if (hasRealConversation) {
    await supabase.from("candidates").update({ status: "completed" }).eq("id", interview.candidate_id);
  }

  // Run analysis once there's enough conversation, and only if not already done.
  let analysis: Record<string, unknown> = { analyzed: false, reason: "transcript too short" };
  if (hasRealConversation) {
    const { data: existing } = await supabase
      .from("evaluations")
      .select("id")
      .eq("interview_id", interview.id)
      .maybeSingle();

    if (existing) {
      analysis = { analyzed: true, reason: "already analyzed" };
    } else {
      const { data: fullInterview, error: fiErr } = await supabase
        .from("interviews")
        .select("*, jobs(title, key_skills, screening_questions(*))")
        .eq("id", interview.id)
        .single();

      if (!fullInterview) {
        analysis = { analyzed: false, reason: "interview/job fetch failed", detail: fiErr?.message };
      } else {
        try {
          const jobData = fullInterview.jobs as {
            title: string;
            key_skills: string[];
            role_criteria?: string[];
            screening_questions: ScreeningQuestion[];
          };
          const result = await analyzeInterview({
            transcript,
            job: { title: jobData.title, key_skills: jobData.key_skills, role_criteria: jobData.role_criteria ?? [] },
            screeningQuestions: jobData.screening_questions ?? [],
          });
          // criteria_results requires migration 004; omit it so analysis works
          // on databases that haven't applied it.
          const evalRow: Record<string, unknown> = { ...result };
          delete evalRow.criteria_results;
          const { error: insErr } = await supabase
            .from("evaluations")
            .insert({ interview_id: interview.id, ...evalRow });
          if (insErr) {
            analysis = { analyzed: false, reason: "evaluation insert failed", detail: insErr.message };
          } else {
            analysis = { analyzed: true };
          }
        } catch (err) {
          console.error("[transcript] analysis failed:", err);
          analysis = { analyzed: false, reason: "analysis threw", detail: err instanceof Error ? err.message : String(err) };
        }
      }
    }
  }

  return NextResponse.json({ received: true, ...analysis });
}
