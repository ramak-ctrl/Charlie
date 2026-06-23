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

  // Mark completed and store the transcript.
  await supabase
    .from("interviews")
    .update({
      status: "completed",
      transcript,
      completed_at: new Date().toISOString(),
    })
    .eq("id", interview.id);

  await supabase.from("candidates").update({ status: "completed" }).eq("id", interview.candidate_id);

  // Run analysis once there's enough conversation, and only if not already done.
  if (transcript.length > 2) {
    const { data: existing } = await supabase
      .from("evaluations")
      .select("id")
      .eq("interview_id", interview.id)
      .single();

    if (!existing) {
      const { data: fullInterview } = await supabase
        .from("interviews")
        .select("*, jobs(title, key_skills, role_criteria, screening_questions(*))")
        .eq("id", interview.id)
        .single();

      if (fullInterview) {
        try {
          const jobData = fullInterview.jobs as {
            title: string;
            key_skills: string[];
            role_criteria: string[];
            screening_questions: ScreeningQuestion[];
          };
          const result = await analyzeInterview({
            transcript,
            job: { title: jobData.title, key_skills: jobData.key_skills, role_criteria: jobData.role_criteria ?? [] },
            screeningQuestions: jobData.screening_questions ?? [],
          });
          await supabase.from("evaluations").insert({ interview_id: interview.id, ...result });
          console.log(`[transcript] analysis complete for interview=${interview.id}`);
        } catch (err) {
          console.error("[transcript] analysis failed:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
