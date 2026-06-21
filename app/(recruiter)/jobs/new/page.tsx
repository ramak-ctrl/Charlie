import JobForm from "@/components/recruiter/JobForm";

export default function NewJobPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", color: "#fff", marginBottom: 4 }}>Create Job</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Define the role and Charlie will screen candidates for you.</p>
      </div>
      <JobForm />
    </div>
  );
}
