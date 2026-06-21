import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JobForm from "@/components/recruiter/JobForm";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs").select("*, screening_questions(*)")
    .eq("id", id).eq("created_by", user!.id).single();

  if (!job) notFound();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", color: "#fff", marginBottom: 4 }}>Edit Job</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>{job.title}</p>
      </div>
      <JobForm job={job as Parameters<typeof JobForm>[0]["job"]} />
    </div>
  );
}
