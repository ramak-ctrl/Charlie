import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Plus } from "lucide-react";
import JobsListClient from "@/components/recruiter/JobsListClient";

type Job = {
  id: string;
  title: string;
  status: string;
  key_skills: string[];
  created_at: string;
  candidates: { count: number }[];
};

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, candidates(count)")
    .eq("created_by", user!.id)
    .order("created_at", { ascending: false });

  const allJobs: Job[] = (jobs as Job[]) ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">{allJobs.length} job{allJobs.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/jobs/new">
          <Button aria-label="Create new job">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {allJobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
            <p className="text-gray-500 mb-6">Create your first job to start screening candidates.</p>
            <Link href="/jobs/new">
              <Button aria-label="Create first job">
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <JobsListClient jobs={allJobs} />
      )}
    </div>
  );
}
