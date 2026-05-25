"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDuration, recommendationColor, recommendationLabel } from "@/lib/utils";
import { Users, Copy, CheckCircle2, Clock, FileText, Trash2, RefreshCw } from "lucide-react";
import EvaluationReport from "./EvaluationReport";
import type { Recommendation } from "@/lib/types";

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  interview_tokens?: { token: string; expires_at: string; used_at: string | null }[];
  interviews?: {
    id: string;
    status: string;
    duration_secs: number | null;
    completed_at: string | null;
    evaluations?: { overall_score: number; recommendation: string } | null;
  }[];
}

interface Props {
  candidates: CandidateRow[];
  jobId: string;
  appUrl: string;
}

export default function CandidateTable({ candidates, jobId, appUrl }: Props) {
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const router = useRouter();

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${appUrl}/interview/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSync(interviewId: string) {
    setSyncing(interviewId);
    await fetch(`/api/interviews/sync/${interviewId}`, { method: "POST" });
    router.refresh();
    setSyncing(null);
  }

  async function handleDelete(candidateId: string, name: string) {
    if (!confirm(`Remove ${name}? This will also delete their interview and report.`)) return;
    setDeleting(candidateId);
    await fetch(`/api/candidates/${candidateId}`, { method: "DELETE" });
    router.refresh();
    setDeleting(null);
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="inline-flex p-3 rounded-full bg-muted mb-3">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No candidates yet. Use &quot;Invite Candidates&quot; to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Candidates">
          <thead>
            <tr className="border-b border-border/60">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Candidate</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Score</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Duration</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {candidates.map((c) => {
              const token = c.interview_tokens?.[0];
              const interview = c.interviews?.[0];
              const evaluation = interview?.evaluations ?? null;
              const isExpired = token ? new Date(token.expires_at) < new Date() : false;

              return (
                <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{c.email}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <CandidateStatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    {evaluation ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground tabular-nums">
                          {evaluation.overall_score.toFixed(1)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${recommendationColor(evaluation.recommendation as Recommendation)}`}>
                          {recommendationLabel(evaluation.recommendation as Recommendation)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs tabular-nums">
                    {formatDuration(interview?.duration_secs ?? null)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      {interview && interview.status === "in_progress" && (
                        <button
                          onClick={() => handleSync(interview.id)}
                          disabled={syncing === interview.id}
                          aria-label={`Sync status for ${c.name}`}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-40"
                          title="Sync interview status"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncing === interview.id ? "animate-spin" : ""}`} />
                        </button>
                      )}

                      {token && !isExpired && !token.used_at && (
                        <button
                          onClick={() => copyLink(token.token)}
                          aria-label={`Copy interview link for ${c.name}`}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                          title="Copy interview link"
                        >
                          {copied === token.token
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            : <Copy className="h-4 w-4" />}
                        </button>
                      )}

                      {interview && evaluation && (
                        <button
                          onClick={() => setSelectedInterview(interview.id)}
                          aria-label={`View report for ${c.name}`}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-colors font-medium"
                        >
                          <FileText className="h-3 w-3" />
                          Report
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deleting === c.id}
                        aria-label={`Delete ${c.name}`}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title="Delete candidate"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedInterview && (
        <EvaluationReport
          interviewId={selectedInterview}
          onClose={() => setSelectedInterview(null)}
        />
      )}
    </>
  );
}

function CandidateStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    invited:   { label: "Invited",     className: "text-muted-foreground bg-muted border-border",                icon: <Clock className="h-3 w-3" /> },
    started:   { label: "In Progress", className: "text-blue-400 bg-blue-500/10 border-blue-500/20",             icon: <Clock className="h-3 w-3" /> },
    completed: { label: "Completed",   className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",   icon: <CheckCircle2 className="h-3 w-3" /> },
    reviewed:  { label: "Reviewed",    className: "text-violet-400 bg-violet-500/10 border-violet-500/20",      icon: <CheckCircle2 className="h-3 w-3" /> },
  };
  const cfg = config[status] ?? config.invited;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
