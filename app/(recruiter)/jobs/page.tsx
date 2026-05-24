import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Plus, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">{allJobs.length} job{allJobs.length !== 1 ? "s" : ""} total</p>
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
        <div className="space-y-3">
          {allJobs.map((job) => {
            const candidateCount = job.candidates?.[0]?.count ?? 0;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4 px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                          <StatusBadge status={job.status} />
                        </div>
                        {job.key_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.key_skills.slice(0, 4).map((s) => (
                              <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                {s}
                              </span>
                            ))}
                            {job.key_skills.length > 4 && (
                              <span className="text-xs text-gray-400">+{job.key_skills.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6 ml-4 text-sm text-gray-500 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{candidateCount}</span>
                        </div>
                        <span>{formatDate(job.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600 border-gray-200",
    active: "bg-green-100 text-green-700 border-green-200",
    paused: "bg-amber-100 text-amber-700 border-amber-200",
    closed: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] ?? styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
