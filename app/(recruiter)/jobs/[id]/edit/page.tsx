import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JobForm from "@/components/recruiter/JobForm";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, screening_questions(*)")
    .eq("id", id)
    .eq("created_by", user!.id)
    .single();

  if (!job) notFound();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
        <p className="text-gray-500 mt-1">{job.title}</p>
      </div>
      <JobForm job={job as Parameters<typeof JobForm>[0]["job"]} />
    </div>
  );
}
