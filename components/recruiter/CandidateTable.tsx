"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDuration, recommendationColor, recommendationLabel } from "@/lib/utils";
import { Users, Copy, CheckCircle2, Clock, FileText, Trash2, RefreshCw } from "lucide-react";
import EvaluationReport from "./EvaluationReport";
import type { Recommendation } from "@/lib/types";

const DARK   = "#1C3829";
const MID    = "#3D6B54";
const MUTED  = "#7A9E8E";
const BORDER = "rgba(28,56,41,0.09)";

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
  candidateRanks?: Record<string, number>;
}

const RANK_STYLE: Record<number, { bg: string; color: string; border: string; label: string }> = {
  1: { bg: "rgba(217,119,6,0.12)",   color: "#92400E", border: "rgba(217,119,6,0.3)",   label: "1st" },
  2: { bg: "rgba(28,56,41,0.08)",    color: "#1C3829", border: "rgba(28,56,41,0.2)",    label: "2nd" },
  3: { bg: "rgba(99,102,241,0.08)",  color: "#4338CA", border: "rgba(99,102,241,0.2)",  label: "3rd" },
};

function getRankStyle(rank: number) {
  return RANK_STYLE[rank] ?? {
    bg: "rgba(28,56,41,0.04)", color: MUTED,
    border: BORDER, label: `${rank}th`,
  };
}

export default function CandidateTable({ candidates, jobId, appUrl, candidateRanks = {} }: Props) {
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const router = useRouter();

  const showRanks = Object.keys(candidateRanks).length >= 2;

  // Sort: ranked candidates first (by rank), then unranked by created_at
  const sorted = [...candidates].sort((a, b) => {
    const aRank = candidateRanks[a.id];
    const bRank = candidateRanks[b.id];
    if (aRank != null && bRank != null) return aRank - bRank;
    if (aRank != null) return -1;
    if (bRank != null) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {showRanks && (
                <th style={{ padding: "12px 8px 12px 14px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", whiteSpace: "nowrap" }}>
                  Rank
                </th>
              )}
              <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Candidate</th>
              <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Score</th>
              <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Duration</th>
              <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, idx) => {
              const token = c.interview_tokens?.[0];
              const interview = c.interviews?.[0];
              const evaluation = interview?.evaluations ?? null;
              const isExpired = token ? new Date(token.expires_at) < new Date() : false;
              const rank = candidateRanks[c.id];
              const rs = rank != null ? getRankStyle(rank) : null;
              const isTopPick = rank === 1 && showRanks;

              return (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: idx < sorted.length - 1 ? `1px solid ${BORDER}` : "none",
                    background: isTopPick ? "rgba(217,119,6,0.03)" : "transparent",
                    transition: "background 0.13s",
                  }}
                  className="hover:bg-green-50/50"
                >
                  {/* Rank badge */}
                  {showRanks && (
                    <td style={{ padding: "14px 8px 14px 14px" }}>
                      {rs ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          minWidth: 36, height: 24, borderRadius: 99,
                          background: rs.bg, color: rs.color,
                          border: `1px solid ${rs.border}`,
                          fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
                        }}>
                          {rs.label}
                        </span>
                      ) : (
                        <span style={{ display: "inline-block", width: 36 }} />
                      )}
                    </td>
                  )}

                  {/* Candidate */}
                  <td style={{ padding: "14px" }}>
                    <div>
                      <p style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>{c.name}</p>
                      <p style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{c.email}</p>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px" }}>
                    <CandidateStatusBadge status={c.status} />
                  </td>

                  {/* Score */}
                  <td style={{ padding: "14px" }}>
                    {evaluation ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: DARK, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                          {evaluation.overall_score.toFixed(1)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${recommendationColor(evaluation.recommendation as Recommendation)}`}>
                          {recommendationLabel(evaluation.recommendation as Recommendation)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "rgba(28,56,41,0.2)", fontSize: 13 }}>—</span>
                    )}
                  </td>

                  {/* Duration */}
                  <td style={{ padding: "14px", color: MUTED, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                    {formatDuration(interview?.duration_secs ?? null)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      {interview && interview.status === "in_progress" && (
                        <button
                          onClick={() => handleSync(interview.id)}
                          disabled={syncing === interview.id}
                          aria-label={`Sync status for ${c.name}`}
                          style={{ padding: 6, borderRadius: 6, background: "none", border: "none", color: MUTED, cursor: "pointer" }}
                          className="hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                          title="Sync interview status"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncing === interview.id ? "animate-spin" : ""}`} />
                        </button>
                      )}

                      {token && !isExpired && !token.used_at && (
                        <button
                          onClick={() => copyLink(token.token)}
                          aria-label={`Copy interview link for ${c.name}`}
                          style={{ padding: 6, borderRadius: 6, background: "none", border: "none", color: MUTED, cursor: "pointer" }}
                          className="hover:text-foreground hover:bg-accent/40 transition-colors"
                          title="Copy interview link"
                        >
                          {copied === token.token
                            ? <CheckCircle2 style={{ width: 16, height: 16, color: "#059669" }} />
                            : <Copy style={{ width: 16, height: 16 }} />}
                        </button>
                      )}

                      {interview && evaluation && (
                        <button
                          onClick={() => setSelectedInterview(interview.id)}
                          aria-label={`View report for ${c.name}`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 12, padding: "5px 10px", borderRadius: 8,
                            background: "rgba(28,56,41,0.07)", color: MID,
                            border: `1px solid rgba(28,56,41,0.12)`,
                            cursor: "pointer", fontWeight: 600,
                          }}
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
                        >
                          <FileText style={{ width: 12, height: 12 }} />
                          Report
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deleting === c.id}
                        aria-label={`Delete ${c.name}`}
                        style={{ padding: 6, borderRadius: 6, background: "none", border: "none", color: MUTED, cursor: "pointer" }}
                        className="hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete candidate"
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ranking footnote */}
      {showRanks && (
        <div style={{
          padding: "8px 16px", borderTop: `1px solid ${BORDER}`,
          fontSize: 11, color: MUTED, background: "rgba(28,56,41,0.02)",
          fontStyle: "italic",
        }}>
          Ranked by role fit criteria met → overall score → communication score.
        </div>
      )}

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
  const config: Record<string, { label: string; style: React.CSSProperties }> = {
    invited:   { label: "Invited",      style: { color: "#6B7280", background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)" } },
    started:   { label: "In Progress",  style: { color: "#1D4ED8", background: "rgba(59,130,246,0.08)",  border: "1px solid rgba(59,130,246,0.2)"  } },
    completed: { label: "Completed",    style: { color: "#059669", background: "rgba(5,150,105,0.08)",   border: "1px solid rgba(5,150,105,0.2)"   } },
    reviewed:  { label: "Reviewed",     style: { color: "#6D28D9", background: "rgba(109,40,217,0.08)",  border: "1px solid rgba(109,40,217,0.2)"  } },
  };
  const cfg = config[status] ?? config.invited;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
      whiteSpace: "nowrap", ...cfg.style,
    }}>
      {status === "completed" && <CheckCircle2 style={{ width: 11, height: 11 }} />}
      {(status === "invited" || status === "started") && <Clock style={{ width: 11, height: 11 }} />}
      {cfg.label}
    </span>
  );
}
