import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendInterviewInvite } from "@/lib/email";

const InviteSchema = z.object({
  candidates: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  })).min(1).max(50),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, company_intro")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const body = await request.json();
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const serviceClient = await createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const c of parsed.data.candidates) {
    try {
      const { data: candidate, error: candError } = await serviceClient
        .from("candidates")
        .insert({ job_id: id, name: c.name, email: c.email, phone: c.phone })
        .select()
        .single();

      if (candError || !candidate) {
        results.push({ email: c.email, success: false, error: candError?.message });
        continue;
      }

      const { data: token, error: tokenError } = await serviceClient
        .from("interview_tokens")
        .insert({ candidate_id: candidate.id, job_id: id })
        .select()
        .single();

      if (tokenError || !token) {
        results.push({ email: c.email, success: false, error: tokenError?.message });
        continue;
      }

      const interviewLink = `${appUrl}/interview/${token.token}`;

      let emailSent = false;
      if (process.env.RESEND_API_KEY) {
        await sendInterviewInvite({
          to: c.email,
          candidateName: c.name,
          jobTitle: job.title,
          companyName: "Our Company",
          interviewLink,
          expiresAt: token.expires_at,
        });
        emailSent = true;
      }

      results.push({ email: c.email, success: true, interviewLink, emailSent });
    } catch (err) {
      results.push({ email: c.email, success: false, error: String(err) });
    }
  }

  return NextResponse.json({ results });
}
