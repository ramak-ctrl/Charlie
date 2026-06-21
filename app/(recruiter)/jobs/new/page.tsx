import JobForm from "@/components/recruiter/JobForm";

const DARK  = "#1C3829";
const MUTED = "#7A9E8E";

export default function NewJobPage() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, marginBottom: 2 }}>
          Create New Job
        </h1>
        <p style={{ fontSize: 13, color: MUTED }}>
          Define the role and Charlie will screen candidates for you.
        </p>
      </div>
      <JobForm />
    </div>
  );
}
