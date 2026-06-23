import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateJobSchema = z.object({
  title:                z.string().min(1).max(200).optional(),
  job_type:             z.enum(["C2H", "FTE", "D2H"]).optional(),
  client:               z.string().optional().nullable(),
  category:             z.string().optional().nullable(),
  experience_min:       z.number().int().min(0).max(30).optional().nullable(),
  experience_max:       z.number().int().min(0).max(30).optional().nullable(),
  notice_period:        z.string().optional().nullable(),
  positions:            z.number().int().min(1).max(999).optional(),
  location:             z.string().optional().nullable(),
  priority:             z.enum(["P0", "P1", "P2", "P3"]).optional(),
  expiry_date:          z.string().optional().nullable(),
  expected_start_date:  z.string().optional().nullable(),
  publish_on_careers:   z.boolean().optional(),
  account_manager:      z.string().optional().nullable(),
  description:          z.string().optional().nullable(),
  company_intro:        z.string().optional().nullable(),
  must_have_skills:     z.string().optional().nullable(),
  nice_to_have_skills:  z.string().optional().nullable(),
  key_skills:           z.array(z.string()).optional(),
  role_criteria:        z.array(z.string()).optional(),
  interview_coverage:   z.array(z.string()).optional(),
  status:               z.enum(["draft", "active", "paused", "closed"]).optional(),
  screening_questions: z.array(z.object({
    id:            z.string().uuid().optional(),
    question:      z.string().min(1),
    question_type: z.enum(["open", "numeric", "boolean", "scale"]),
    order_index:   z.number().int(),
    is_default:    z.boolean().default(false),
  })).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("jobs")
    .select("*, screening_questions(*)")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: job } = await supabase
    .from("jobs").select("id").eq("id", id).eq("created_by", user.id).single();
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateJobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { screening_questions, interview_coverage, ...jobData } = parsed.data;

  const { data: updatedJob, error } = await supabase
    .from("jobs").update(jobData).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Persist coverage separately so a missing column (pre-migration 006) can't
  // break the main job save.
  if (interview_coverage !== undefined) {
    const { error: covErr } = await supabase.from("jobs").update({ interview_coverage }).eq("id", id);
    if (covErr) console.warn("[jobs] interview_coverage not saved (run migration 006):", covErr.message);
  }

  if (screening_questions !== undefined) {
    await supabase.from("screening_questions").delete().eq("job_id", id);
    if (screening_questions.length > 0) {
      await supabase.from("screening_questions").insert(
        screening_questions.map(({ id: _id, ...q }) => ({ ...q, job_id: id }))
      );
    }
  }

  return NextResponse.json(updatedJob);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: job } = await supabase
    .from("jobs").select("id").eq("id", id).eq("created_by", user.id).single();
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
