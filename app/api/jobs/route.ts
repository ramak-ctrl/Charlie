import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_SCREENING_QUESTIONS } from "@/lib/utils";

const CreateJobSchema = z.object({
  title:                z.string().min(1).max(200),
  job_type:             z.enum(["C2H", "FTE", "D2H"]).default("FTE"),
  client:               z.string().optional().nullable(),
  category:             z.string().optional().nullable(),
  experience_min:       z.number().int().min(0).max(30).optional(),
  experience_max:       z.number().int().min(0).max(30).optional(),
  notice_period:        z.string().optional().nullable(),
  positions:            z.number().int().min(1).max(999).default(1),
  location:             z.string().optional().nullable(),
  priority:             z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
  expiry_date:          z.string().optional().nullable(),
  expected_start_date:  z.string().optional().nullable(),
  publish_on_careers:   z.boolean().default(false),
  account_manager:      z.string().optional().nullable(),
  description:          z.string().optional().nullable(),
  company_intro:        z.string().optional().nullable(),
  must_have_skills:     z.string().optional().nullable(),
  nice_to_have_skills:  z.string().optional().nullable(),
  key_skills:           z.array(z.string()).default([]),
  status:               z.enum(["draft", "active", "paused", "closed"]).default("draft"),
  screening_questions: z.array(z.object({
    question:      z.string().min(1),
    question_type: z.enum(["open", "numeric", "boolean", "scale"]),
    order_index:   z.number().int(),
    is_default:    z.boolean().default(false),
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
