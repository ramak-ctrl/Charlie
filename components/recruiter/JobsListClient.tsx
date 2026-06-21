"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Trash2, ArrowRight } from "lucide-react";
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
    <div className="glass-card overflow-hidden">
      <table className="w-full text-sm" role="table" aria-label="Jobs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground">Job Title</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Key Skills</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Candidates</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Created</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {jobs.map((job) => {
            const candidateCount = job.candidates?.[0]?.count ?? 0;
            return (
              <tr
                key={job.id}
                className="hover:bg-accent/40 transition-colors cursor-pointer group"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                {/* Title */}
                <td className="py-3.5 px-5">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {job.title}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <StatusBadge status={job.status} />
                </td>

                {/* Skills */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {job.key_skills?.slice(0, 3).map((s) => (
                      <span key={s} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {job.key_skills?.length > 3 && (
                      <span className="text-xs text-muted-foreground/60">+{job.key_skills.length - 3}</span>
                    )}
                    {!job.key_skills?.length && (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* Candidates */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Users className="h-3.5 w-3.5" />
                    <span>{candidateCount}</span>
                  </div>
                </td>

                {/* Created */}
                <td className="py-3.5 px-4 text-muted-foreground text-xs tabular-nums">
                  {formatDate(job.created_at)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => handleDelete(e, job.id)}
                      disabled={deleting === job.id}
                      aria-label={`Delete ${job.title}`}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      title="Delete job"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft:  "bg-muted text-muted-foreground border-border",
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
