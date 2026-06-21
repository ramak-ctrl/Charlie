import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JobForm from "@/components/recruiter/JobForm";

const DARK  = "#1C3829";
const MUTED = "#7A9E8E";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from("jobs").select("*, screening_questions(*)")
      .eq("id", id).eq("created_by", user!.id).single(),
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
  ]);

  if (!job) notFound();

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, marginBottom: 2 }}>
          Edit Job
        </h1>
        <p style={{ fontSize: 13, color: MUTED }}>{job.title}</p>
      </div>
      <JobForm job={job as Parameters<typeof JobForm>[0]["job"]} userFullName={profile?.full_name ?? ""} />
    </div>
  );
}
