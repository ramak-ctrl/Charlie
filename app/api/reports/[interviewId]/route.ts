import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ interviewId: string }> }) {
  const { interviewId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: interview } = await supabase
    .from("interviews")
    .select("*, candidates(*), evaluations(*)")
    .eq("id", interviewId)
    .single();

  if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", interview.job_id)
    .eq("created_by", user.id)
    .single();

  if (!job) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    interview,
    evaluation: (interview.evaluations as unknown[])?.[0] ?? null,
  });
}
