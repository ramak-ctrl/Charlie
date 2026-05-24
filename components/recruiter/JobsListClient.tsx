"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  status: string;
  key_skills: string[];
  created_at: string;
  candidates: { count: number }[];
};

export default function JobsListClient({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, jobId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this job? This will also remove all candidates and interviews.")) return;
    setDeleting(jobId);
    await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    router.refresh();
    setDeleting(null);
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const candidateCount = job.candidates?.[0]?.count ?? 0;
        return (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                      <StatusBadge status={job.status} />
                    </div>
                    {job.key_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.key_skills.slice(0, 4).map((s) => (
                          <span key={s} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                        {job.key_skills.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{job.key_skills.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{candidateCount}</span>
                      </div>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, job.id)}
                      disabled={deleting === job.id}
                      aria-label={`Delete ${job.title}`}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      title="Delete job"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
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
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] ?? styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
