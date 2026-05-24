import JobForm from "@/components/recruiter/JobForm";

export default function NewJobPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Job</h1>
        <p className="text-gray-500 mt-1">Define the role and Charlie will screen candidates for you.</p>
      </div>
      <JobForm />
    </div>
  );
}
