import { createClient } from "@/lib/supabase/server";
import JobForm from "@/components/recruiter/JobForm";

const DARK  = "#1C3829";
const MUTED = "#7A9E8E";

export default async function NewJobPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("full_name").eq("id", user!.id).single();

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, marginBottom: 2 }}>
          Create New Job
        </h1>
        <p style={{ fontSize: 13, color: MUTED }}>
          Define the role and Charlie will screen candidates for you.
        </p>
      </div>
      <JobForm userFullName={profile?.full_name ?? ""} />
    </div>
  );
}
