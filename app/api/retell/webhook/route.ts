import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";
import { analyzeInterview } from "@/lib/anthropic";
import type { ScreeningQuestion } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-retell-signature") ?? "";

  const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;
  if (webhookSecret) {
    const isValid = Retell.verify(body, webhookSecret, signature);
    if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const { event: eventType, data: callData } = event;
  const callId = callData?.call_id;

  console.log(`[webhook] event=${eventType} call_id=${callId}`);

  if (!callId || (eventType !== "call_ended" && eventType !== "call_analyzed")) {
    return NextResponse.json({ received: true });
  }

  const supabase = await createServiceClient();
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, candidate_id, status")
    .eq("retell_call_id", callId)
    .single();

  if (!interview) return NextResponse.json({ received: true });

  if (eventType === "call_ended") {
    // Mark the call as completed with basic metadata.
    // Transcript is not yet available at call_ended time — wait for call_analyzed.
    const durationMs = callData?.duration_ms as number | undefined;
    await supabase
      .from("interviews")
      .update({
        status: "completed",
        recording_url: (callData?.recording_url as string | undefined) ?? null,
        duration_secs: durationMs ? Math.floor(durationMs / 1000) : null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", interview.id);

    await supabase
      .from("candidates")
      .update({ status: "completed" })
      .eq("id", interview.candidate_id);

    return NextResponse.json({ received: true });
  }

  // call_analyzed — transcript is fully processed and ready.
  // transcript_object is the structured array; transcript is a plain text string.
  const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! });
  let fullCall: Awaited<ReturnType<typeof retell.call.retrieve>>;
  try {
    fullCall = await retell.call.retrieve(callId);
  } catch {
    return NextResponse.json({ received: true });
  }

  const transcriptObject = fullCall.transcript_object ?? [];
  const transcript = transcriptObject.map((t) => ({ role: t.role, content: t.content }));

  await supabase
    .from("interviews")
    .update({ transcript })
    .eq("id", interview.id);

  if (transcript.length > 2) {
    // Run analysis directly — avoids depending on NEXT_PUBLIC_APP_URL being correct
    const { data: fullInterview } = await supabase
      .from("interviews")
      .select("*, jobs(title, key_skills, screening_questions(*))")
      .eq("id", interview.id)
      .single();

    if (fullInterview) {
      const { data: existing } = await supabase
        .from("evaluations")
        .select("id")
        .eq("interview_id", interview.id)
        .single();

      if (!existing) {
        try {
          const jobData = fullInterview.jobs as { title: string; key_skills: string[]; screening_questions: ScreeningQuestion[] };
          const result = await analyzeInterview({
            transcript: transcript as { role: "agent" | "user"; content: string }[],
            job: { title: jobData.title, key_skills: jobData.key_skills },
            screeningQuestions: jobData.screening_questions ?? [],
          });
          await supabase.from("evaluations").insert({ interview_id: interview.id, ...result });
          console.log(`[webhook] analysis complete for interview=${interview.id}`);
        } catch (err) {
          console.error("[webhook] analysis failed:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
