import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message, results: [] }, { status: 200 });

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
