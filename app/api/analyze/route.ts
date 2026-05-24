import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeInterview } from "@/lib/anthropic";
import type { ScreeningQuestion } from "@/lib/types";

const BodySchema = z.object({
  interview_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "interview_id required" }, { status: 400 });

  const supabase = await createServiceClient();

  const { data: interview } = await supabase
    .from("interviews")
    .select("*, jobs(title, key_skills, screening_questions(*))")
    .eq("id", parsed.data.interview_id)
    .single();

  if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  if (!interview.transcript || (interview.transcript as unknown[]).length === 0) {
    return NextResponse.json({ error: "No transcript available" }, { status: 422 });
  }

  const { data: existing } = await supabase
    .from("evaluations")
    .select("id")
    .eq("interview_id", interview.id)
    .single();

  if (existing) return NextResponse.json({ message: "Already analyzed", id: existing.id });

  const jobData = interview.jobs as { title: string; key_skills: string[]; screening_questions: ScreeningQuestion[] };

  try {
    const result = await analyzeInterview({
      transcript: interview.transcript as { role: "agent" | "user"; content: string }[],
      job: { title: jobData.title, key_skills: jobData.key_skills },
      screeningQuestions: jobData.screening_questions ?? [],
    });

    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .insert({ interview_id: interview.id, ...result })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(evaluation, { status: 201 });
  } catch (err) {
    console.error("Analysis failed:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
