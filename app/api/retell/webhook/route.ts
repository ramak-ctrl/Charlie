import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    fetch(`${appUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interview_id: interview.id }),
    }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
