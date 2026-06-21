import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

const STATUS_TILES = [
  { key: "draft",  label: "Draft",  color: "text-muted-foreground", bg: "bg-muted/60 border-border/60" },
  { key: "active", label: "Active", color: "text-emerald-400",       bg: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "paused", label: "Paused", color: "text-amber-400",         bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "closed", label: "Closed", color: "text-rose-400",          bg: "bg-rose-500/10 border-rose-500/20" },
];

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, candidates(count)")
    .eq("created_by", user!.id)
    .order("created_at", { ascending: false });

  const allJobs: Job[] = (jobs as Job[]) ?? [];

  const counts = STATUS_TILES.reduce((acc, s) => {
    acc[s.key] = allJobs.filter((j) => j.status === s.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1 text-sm">{allJobs.length} job{allJobs.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/jobs/new">
          <Button aria-label="Create new job">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Status tiles */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {STATUS_TILES.map((s) => (
          <div key={s.key} className={`glass-card px-4 py-3 border ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {allJobs.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4 text-sm">No jobs yet. Create your first one.</p>
          <Link href="/jobs/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </Link>
        </div>
      ) : (
        <JobsListClient jobs={allJobs} />
      )}
    </div>
  );
}
