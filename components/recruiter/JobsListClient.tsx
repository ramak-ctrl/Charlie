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
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <div className="flex items-center gap-6 text-sm text-gray-500">
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
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
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
