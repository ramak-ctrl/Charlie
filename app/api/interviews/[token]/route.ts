import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("interview_tokens")
    .select("*, candidates(*), jobs(id, title, company_intro, key_skills, screening_questions(*))")
    .eq("token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "This interview link has expired" }, { status: 410 });
  }

  return NextResponse.json(data);
}
