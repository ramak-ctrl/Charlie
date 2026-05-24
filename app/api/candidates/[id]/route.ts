import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, jobs(created_by)")
    .eq("id", id)
    .single();

  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const job = (candidate as unknown as { jobs: { created_by: string } }).jobs;
  if (job.created_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
