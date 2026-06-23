"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, Clock, CheckCircle2, Star,
  Search, Trash2, ArrowRight, ExternalLink, FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import EvaluationReport from "@/components/recruiter/EvaluationReport";
import type { CandidateRow } from "@/app/(recruiter)/candidates/page";
import { ColumnCustomizer, useColumnVisibility, type ColumnDef } from "./ColumnCustomizer";

const CAND_COLUMNS: ColumnDef[] = [
  { key: "job", label: "Job" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score" },
  { key: "roleFit", label: "Role Fit" },
  { key: "probe", label: "Probe" },
  { key: "notice", label: "Notice" },
  { key: "location", label: "Location" },
  { key: "added", label: "Added" },
];

const DARK   = "#1C3829";
const MID    = "#3D6B54";
const MUTED  = "#7A9E8E";
const LIME   = "#B8E04A";
const BORDER = "rgba(28,56,41,0.09)";

const STATUS_CONFIG = [
  { key: "all",       label: "ALL",         accent: "#6366F1", icon: Users       },
  { key: "invited",   label: "INVITED",     accent: "#3B82F6", icon: UserCheck   },
  { key: "started",   label: "IN PROGRESS", accent: "#D97706", icon: Clock       },
  { key: "completed", label: "COMPLETED",   accent: "#059669", icon: CheckCircle2 },
  { key: "reviewed",  label: "REVIEWED",    accent: "#8B5CF6", icon: Star        },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  invited:   { color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)"  },
  started:   { color: "#D97706", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.2)"   },
  completed: { color: "#059669", bg: "rgba(5,150,105,0.1)",   border: "rgba(5,150,105,0.2)"   },
  reviewed:  { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)"  },
};

const RANK_STYLE: Record<number, { bg: string; color: string; border: string; label: string }> = {
  1: { bg: "rgba(217,119,6,0.12)",  color: "#92400E", border: "rgba(217,119,6,0.28)",  label: "1st" },
  2: { bg: "rgba(28,56,41,0.08)",   color: "#1C3829", border: "rgba(28,56,41,0.2)",    label: "2nd" },
  3: { bg: "rgba(99,102,241,0.1)",  color: "#4338CA", border: "rgba(99,102,241,0.22)", label: "3rd" },
};

function getRank(rank: number) {
  return RANK_STYLE[rank] ?? { bg: "rgba(28,56,41,0.04)", color: MUTED, border: BORDER, label: `${rank}th` };
}

const TH: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: 10, fontWeight: 700,
  color: "rgba(255,255,255,0.50)",
  letterSpacing: "0.1em", textAlign: "left",
  whiteSpace: "nowrap",
};

interface Props {
  candidates: CandidateRow[];
  candidateRanks: Record<string, number>;
}

export default function CandidatesListClient({ candidates, candidateRanks }: Props) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reportInterviewId, setReportInterviewId] = useState<string | null>(null);
  const { visible, toggle } = useColumnVisibility("candidates-table-cols", CAND_COLUMNS);

  const counts: Record<string, number> = {
    all:       candidates.length,
    invited:   candidates.filter(c => c.status === "invited").length,
    started:   candidates.filter(c => c.status === "started").length,
    completed: candidates.filter(c => c.status === "completed").length,
    reviewed:  candidates.filter(c => c.status === "reviewed").length,
  };

  const filtered = candidates.filter(c => {
    const matchesFilter = activeFilter === "all" || c.status === activeFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q
      || c.name.toLowerCase().includes(q)
      || c.email.toLowerCase().includes(q)
      || (c.jobs?.title ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Remove this candidate? Their interview data will also be deleted.")) return;
    setDeleting(id);
    await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    router.refresh();
    setDeleting(null);
  }

  return (
    <div>
      {/* ── STATUS TILES ── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
          Status Overview · {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
        </p>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
          {STATUS_CONFIG.map((cfg) => {
            const Icon = cfg.icon;
            const isActive = activeFilter === cfg.key;
            return (
              <button key={cfg.key} onClick={() => setActiveFilter(cfg.key)} style={{
                flexShrink: 0, minWidth: 108, background: "#fff",
                border: isActive ? `2px solid ${cfg.accent}` : "2px solid rgba(28,56,41,0.07)",
                borderRadius: 10, padding: "14px 14px 12px",
                cursor: "pointer", position: "relative", overflow: "hidden",
                textAlign: "left", outline: "none", transition: "all 0.17s ease",
                boxShadow: isActive ? `0 0 0 1px ${cfg.accent}20, 0 6px 20px ${cfg.accent}18` : "0 1px 6px rgba(28,56,41,0.06)",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: cfg.accent, borderRadius: "8px 8px 0 0" }} />
                <div style={{ marginBottom: 10, marginTop: 4 }}><Icon style={{ width: 15, height: 15, color: cfg.accent }} /></div>
                <p style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, color: DARK, marginBottom: 5 }}>{counts[cfg.key] ?? 0}</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.08em" }}>{cfg.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH + CUSTOMISE ── */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "0 14px", boxShadow: "0 1px 4px rgba(28,56,41,0.05)" }}>
          <Search style={{ width: 15, height: 15, color: MUTED, flexShrink: 0 }} />
          <input
            type="text" placeholder="Search by name, email, or job..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: "12px 0", background: "none", border: "none", outline: "none", fontSize: 13, color: DARK }}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: "4px 2px", fontSize: 13 }}>✕</button>}
        </div>
        <ColumnCustomizer columns={CAND_COLUMNS} visible={visible} onToggle={toggle} />
      </div>

      {/* ── TABLE ── */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, textAlign: "center", padding: "60px 40px", boxShadow: "0 2px 12px rgba(28,56,41,0.06)" }}>
          <div style={{ display: "inline-flex", padding: 18, borderRadius: "50%", background: "rgba(28,56,41,0.06)", border: `1px solid ${BORDER}`, marginBottom: 14 }}>
            <Users style={{ width: 22, height: 22, color: MUTED }} />
          </div>
          <p style={{ fontSize: 14, color: MUTED }}>
            {search ? `No candidates match "${search}"` : "No candidates yet. Invite them from a job listing."}
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 16px rgba(28,56,41,0.07)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Candidates">
              <thead>
                <tr style={{ background: "#172F22" }}>
                  <th style={{ ...TH, width: 60 }}>RANK</th>
                  <th style={TH}>CANDIDATE</th>
                  {visible.job && <th style={TH}>JOB</th>}
                  {visible.status && <th style={TH}>STATUS</th>}
                  {visible.score && <th style={TH}>SCORE</th>}
                  {visible.roleFit && <th style={TH}>ROLE FIT</th>}
                  {visible.probe && <th style={TH}>PROBE</th>}
                  {visible.notice && <th style={TH}>NOTICE</th>}
                  {visible.location && <th style={TH}>LOCATION</th>}
                  {visible.added && <th style={TH}>ADDED</th>}
                  <th style={{ ...TH, textAlign: "right", width: 100 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const st           = STATUS_STYLE[c.status] ?? STATUS_STYLE.invited;
                  const accentColor  = STATUS_CONFIG.find(cfg => cfg.key === c.status)?.accent ?? "#3B82F6";
                  const interview    = c.interviews?.[0];
                  const evaluation   = interview?.evaluations ?? null;
                  const rank         = candidateRanks[c.id];
                  const rs           = rank != null ? getRank(rank) : null;
                  const isTopPick    = rank === 1;

                  const criteriaResults = evaluation?.criteria_results ?? [];
                  const metCount     = criteriaResults.filter(r => r.status === "met").length;
                  const totalCount   = criteriaResults.length;
                  const probeCriteria = criteriaResults.filter(r => r.status === "unconfirmed").map(r => r.criterion);

                  return (
                    <tr key={c.id}
                      style={{
                        borderBottom: idx < filtered.length - 1 ? `1px solid ${BORDER}` : "none",
                        cursor: "pointer", transition: "background 0.13s",
                        background: isTopPick && rank != null ? "rgba(217,119,6,0.02)" : "transparent",
                      }}
                      className="hover:bg-emerald-50/40 group"
                      onClick={() => c.jobs && router.push(`/jobs/${c.jobs.id}`)}>

                      {/* Rank */}
                      <td style={{ padding: "13px 8px 13px 14px", position: "relative" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accentColor, borderRadius: "0 2px 2px 0" }} />
                        {rs ? (
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 22, borderRadius: 99, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, fontSize: 10, fontWeight: 800 }}>
                            {rs.label}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "rgba(28,56,41,0.2)" }}>—</span>
                        )}
                      </td>

                      {/* Candidate */}
                      <td style={{ padding: "13px 14px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: DARK }} className="group-hover:text-emerald-700 transition-colors">{c.name}</p>
                        <p style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{c.email}</p>
                      </td>

                      {/* Job */}
                      {visible.job && (
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: MID, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {c.jobs?.title ?? "—"}
                          </span>
                        </td>
                      )}

                      {/* Status */}
                      {visible.status && (
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: "nowrap" }}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                      )}

                      {/* Score */}
                      {visible.score && (
                        <td style={{ padding: "13px 14px" }}>
                          {evaluation?.overall_score != null ? (
                            <span style={{ fontSize: 13, fontWeight: 800, color: DARK, display: "inline-flex", alignItems: "baseline", gap: 2 }}>
                              {Number(evaluation.overall_score).toFixed(1)}
                              <span style={{ fontSize: 10, fontWeight: 400, color: MUTED }}>/10</span>
                            </span>
                          ) : (
                            <span style={{ color: "rgba(28,56,41,0.2)", fontSize: 12 }}>—</span>
                          )}
                        </td>
                      )}

                      {/* Role Fit */}
                      {visible.roleFit && (
                        <td style={{ padding: "13px 14px" }}>
                          {totalCount > 0 ? (
                            <span style={{
                              fontSize: 12, fontWeight: 700,
                              color: metCount === totalCount ? "#059669" : metCount >= totalCount / 2 ? "#D97706" : "#DC2626",
                            }}>
                              {metCount}/{totalCount} criteria
                            </span>
                          ) : evaluation ? (
                            <span style={{ fontSize: 11, color: MUTED }}>No criteria set</span>
                          ) : (
                            <span style={{ color: "rgba(28,56,41,0.2)", fontSize: 12 }}>—</span>
                          )}
                        </td>
                      )}

                      {/* Probe */}
                      {visible.probe && (
                        <td style={{ padding: "13px 14px", maxWidth: 180 }}>
                          {probeCriteria.length > 0 ? (
                            <span style={{ fontSize: 11, color: "#D97706", fontWeight: 500 }} title={probeCriteria.join(", ")}>
                              {probeCriteria[0]}{probeCriteria.length > 1 ? ` +${probeCriteria.length - 1}` : ""}
                            </span>
                          ) : evaluation ? (
                            <span style={{ fontSize: 11, color: "#059669" }}>All confirmed</span>
                          ) : (
                            <span style={{ color: "rgba(28,56,41,0.2)", fontSize: 12 }}>—</span>
                          )}
                        </td>
                      )}

                      {/* Notice */}
                      {visible.notice && (
                        <td style={{ padding: "13px 14px", fontSize: 12, color: MID, whiteSpace: "nowrap" }}>
                          {c.notice_period ?? <span style={{ color: "rgba(28,56,41,0.2)" }}>—</span>}
                        </td>
                      )}

                      {/* Location */}
                      {visible.location && (
                        <td style={{ padding: "13px 14px", fontSize: 12, color: MID }}>
                          {c.current_location ?? <span style={{ color: "rgba(28,56,41,0.2)" }}>—</span>}
                        </td>
                      )}

                      {/* Added */}
                      {visible.added && (
                        <td style={{ padding: "13px 14px", fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>
                          {formatDate(c.created_at)}
                        </td>
                      )}

                      {/* Actions */}
                      <td style={{ padding: "13px 10px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                          {/* Report button — only if evaluated */}
                          {interview && evaluation && (
                            <button
                              onClick={e => { e.stopPropagation(); setReportInterviewId(interview.id); }}
                              aria-label={`View report for ${c.name}`}
                              title="View evaluation report"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                fontSize: 11, padding: "5px 10px", borderRadius: 8,
                                background: "rgba(28,56,41,0.07)", color: MID,
                                border: "1px solid rgba(28,56,41,0.12)",
                                cursor: "pointer", fontWeight: 600,
                              }}
                              className="hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
                            >
                              <FileText style={{ width: 11, height: 11 }} />
                              Report
                            </button>
                          )}

                          {c.linkedin_url && (
                            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              aria-label="LinkedIn"
                              style={{ padding: 6, borderRadius: 7, color: MUTED, display: "flex" }}
                              className="hover:bg-blue-50 hover:!text-blue-500 transition-colors">
                              <ExternalLink style={{ width: 12, height: 12 }} />
                            </a>
                          )}

                          <button onClick={e => handleDelete(e, c.id)} disabled={deleting === c.id}
                            aria-label={`Delete ${c.name}`}
                            style={{ padding: 6, borderRadius: 7, background: "none", border: "none", color: MUTED, cursor: "pointer", opacity: deleting === c.id ? 0.4 : 1 }}
                            className="hover:bg-red-50 hover:!text-red-500 transition-colors">
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>

                          <div style={{ padding: 6, color: "rgba(28,56,41,0.2)" }} className="group-hover:!text-emerald-500 transition-colors">
                            <ArrowRight style={{ width: 12, height: 12 }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 20px", borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, background: "rgba(28,56,41,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Showing {filtered.length} of {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}</span>
            {Object.keys(candidateRanks).length >= 2 && (
              <span style={{ fontSize: 11, color: MUTED, fontStyle: "italic" }}>
                Ranked by criteria met → overall score → communication score (per job)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportInterviewId && (
        <EvaluationReport
          interviewId={reportInterviewId}
          onClose={() => setReportInterviewId(null)}
        />
      )}
    </div>
  );
}
