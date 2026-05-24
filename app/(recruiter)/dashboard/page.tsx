import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, CheckCircle2, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Job = { id: string; title: string; status: string; created_at: string };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .eq("created_by", user!.id)
    .order("created_at", { ascending: false });

  const { data: candidateStats } = await supabase
    .from("candidates")
    .select("status, jobs!inner(created_by)")
    .eq("jobs.created_by", user!.id);

  const allJobs: Job[] = jobs ?? [];
  const activeJobs = allJobs.filter((j) => j.status === "active").length;
  const totalCandidates = candidateStats?.length ?? 0;
  const completedInterviews = candidateStats?.filter((c) => c.status === "completed").length ?? 0;

  const stats = [
    { label: "Total Jobs", value: allJobs.length, icon: Briefcase, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Active Jobs", value: activeJobs, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Total Candidates", value: totalCandidates, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Completed Interviews", value: completedInterviews, icon: CheckCircle2, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back. Here&apos;s your hiring overview.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className={`inline-flex p-2.5 rounded-lg border ${s.bg} mb-3`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-sm font-semibold text-foreground">Recent Jobs</h2>
          <Link href="/jobs">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {allJobs.length === 0 ? (
          <div className="text-center py-16">
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
          <div className="divide-y divide-border/40">
            {allJobs.slice(0, 8).map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div>
                    <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(job.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={job.status} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-muted text-muted-foreground border-border",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    closed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] ?? styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
