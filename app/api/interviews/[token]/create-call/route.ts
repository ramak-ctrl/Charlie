import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  consent_given: z.boolean(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "consent_given is required" }, { status: 400 });
  if (!parsed.data.consent_given) return NextResponse.json({ error: "Consent is required" }, { status: 400 });

  const supabase = await createServiceClient();

  const { data: tokenData, error: tokenError } = await supabase
    .from("interview_tokens")
    .select("*, candidates(*), jobs(id, title, company_intro, key_skills, screening_questions(*))")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  // If token already used and interview completed, block
  if (tokenData.used_at) {
    const { data: existingInterview } = await supabase
      .from("interviews")
      .select("id, status, retell_call_id")
      .eq("token_id", tokenData.id)
      .single();

    if (existingInterview?.status === "completed") {
      return NextResponse.json({ error: "Interview already completed" }, { status: 409 });
    }

    // In-progress interview from a broken previous attempt — delete it so we can restart
    if (existingInterview) {
      await supabase.from("interviews").delete().eq("id", existingInterview.id);
    }

    // Clear used_at so the token can be used again
    await supabase.from("interview_tokens").update({ used_at: null }).eq("id", tokenData.id);
  }

  const candidate = tokenData.candidates as { id: string; name: string; email: string };
  const job = tokenData.jobs as {
    id: string; title: string; company_intro: string | null;
    key_skills: string[];
    screening_questions: { question: string; order_index: number }[];
  };

  const screeningQs = (job.screening_questions ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => q.question);

  // Create Retell web call via direct REST (bypasses SDK version issues)
  const retellRes = await fetch("https://api.retellai.com/v2/create-web-call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RETELL_API_KEY}`,
    },
    body: JSON.stringify({
      agent_id: process.env.RETELL_AGENT_ID,
      retell_llm_dynamic_variables: {
        candidate_name: candidate.name,
        job_title: job.title,
        company_intro: job.company_intro ?? "We are an innovative company looking for great talent.",
        key_skills: (job.key_skills ?? []).join(", "),
        screening_questions: screeningQs.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      },
    }),
  });

  if (!retellRes.ok) {
    const errText = await retellRes.text();
    console.error("Retell createWebCall failed:", retellRes.status, errText);
    return NextResponse.json({ error: `Failed to create call: ${errText}` }, { status: 502 });
  }

  const webCall = await retellRes.json();

  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .insert({
      token_id: tokenData.id,
      candidate_id: candidate.id,
      job_id: job.id,
      retell_call_id: webCall.call_id,
      status: "in_progress",
      consent_given: true,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (interviewError || !interview) {
    console.error("Interview insert failed:", interviewError);
    return NextResponse.json({ error: "Failed to create interview record" }, { status: 500 });
  }

  await supabase
    .from("interview_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenData.id);

  await supabase
    .from("candidates")
    .update({ status: "started" })
    .eq("id", candidate.id);

  return NextResponse.json({
    access_token: webCall.access_token,
    call_id: webCall.call_id,
    interview_id: interview.id,
  });
}
