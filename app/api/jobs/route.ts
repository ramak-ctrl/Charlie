import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_SCREENING_QUESTIONS } from "@/lib/utils";

const CreateJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  company_intro: z.string().optional(),
  key_skills: z.array(z.string()).default([]),
  status: z.enum(["draft", "active"]).default("draft"),
  screening_questions: z.array(z.object({
    question: z.string().min(1),
    question_type: z.enum(["open", "numeric", "boolean", "scale"]),
    order_index: z.number().int(),
    is_default: z.boolean().default(false),
  })).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("jobs")
    .select("*, screening_questions(*)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { screening_questions, ...jobData } = parsed.data;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({ ...jobData, created_by: user.id })
    .select()
    .single();

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });

  const questions = screening_questions ?? DEFAULT_SCREENING_QUESTIONS;
  const { error: qError } = await supabase
    .from("screening_questions")
    .insert(questions.map((q) => ({ ...q, job_id: job.id })));

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  return NextResponse.json(job, { status: 201 });
}
