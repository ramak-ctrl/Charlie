import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  job_id: z.string().uuid(),
  screening: z.boolean().default(false),
});

// Search the recruiter's existing candidates by name/email (for the invite picker).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  let query = supabase
    .from("candidates")
    .select("name, email, jobs!inner(created_by)")
    .eq("jobs.created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data } = await query;
  // De-dupe by email (a person may exist under several jobs).
  const seen = new Set<string>();
  const results: { name: string; email: string }[] = [];
  for (const row of data ?? []) {
    const email = (row.email ?? "").toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    results.push({ name: row.name, email: row.email });
    if (results.length >= 8) break;
  }
  return NextResponse.json({ results });
}

// Create a candidate and map it to a job. If screening is requested, also mint an
// interview token and return its link.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Name, a valid email, and a job are required." }, { status: 400 });
  }
  const { name, email, job_id, screening } = parsed.data;

  // Verify the job belongs to this recruiter.
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", job_id)
    .eq("created_by", user.id)
    .single();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const service = await createServiceClient();

  const { data: candidate, error: candErr } = await service
    .from("candidates")
    .insert({ job_id, name: name.trim(), email: email.trim(), status: "invited" })
    .select()
    .single();
  if (candErr || !candidate) {
    return NextResponse.json({ error: candErr?.message ?? "Failed to create candidate" }, { status: 500 });
  }

  let interviewLink: string | undefined;
  if (screening) {
    const { data: token, error: tokenErr } = await service
      .from("interview_tokens")
      .insert({ candidate_id: candidate.id, job_id })
      .select()
      .single();
    if (tokenErr || !token) {
      return NextResponse.json(
        { error: "Candidate created, but generating the screening link failed.", candidate },
        { status: 500 }
      );
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    interviewLink = `${appUrl}/interview/${token.token}`;
  }

  return NextResponse.json({ candidate, interviewLink }, { status: 201 });
}
