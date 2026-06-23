"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid, FileText, Zap, PauseCircle, XCircle,
  Search, Users, Trash2, ArrowRight, Briefcase, Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ColumnCustomizer, useColumnVisibility, type ColumnDef } from "./ColumnCustomizer";

const JOB_COLUMNS: ColumnDef[] = [
  { key: "client", label: "Client" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
  { key: "experience", label: "Experience" },
  { key: "positions", label: "Positions" },
  { key: "location", label: "Location" },
  { key: "candidates", label: "Candidates" },
  { key: "created", label: "Created" },
];

type Job = {
  id: string;
  title: string;
  job_type?: string;
  client?: string | null;
  category?: string | null;
  status: string;
  experience_min?: number | null;
  experience_max?: number | null;
  positions?: number;
  location?: string | null;
  priority?: string | null;
  notice_period?: string | null;
  account_manager?: string | null;
  key_skills: string[];
  created_at: string;
  candidates: { count: number }[];
};

const DARK   = "#1C3829";
const MID    = "#3D6B54";
const MUTED  = "#7A9E8E";
const BORDER = "rgba(28,56,41,0.09)";

const STATUS_CONFIG = [
  { key: "all",    label: "ALL",    accent: "#6366F1", icon: LayoutGrid  },
  { key: "draft",  label: "DRAFT",  accent: "#9CA3AF", icon: FileText    },
  { key: "active", label: "ACTIVE", accent: "#059669", icon: Zap         },
  { key: "paused", label: "PAUSED", accent: "#D97706", icon: PauseCircle },
  { key: "closed", label: "CLOSED", accent: "#DC2626", icon: XCircle     },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  draft:  { color: "#6B7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
  active: { color: "#059669", bg: "rgba(5,150,105,0.1)",   border: "rgba(5,150,105,0.2)"   },
  paused: { color: "#D97706", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.2)"   },
  closed: { color: "#DC2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.15)"  },
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  P0: { color: "#DC2626", bg: "rgba(220,38,38,0.08)"   },
  P1: { color: "#D97706", bg: "rgba(217,119,6,0.08)"   },
  P2: { color: "#6366F1", bg: "rgba(99,102,241,0.08)"  },
  P3: { color: "#7A9E8E", bg: "rgba(122,158,142,0.1)"  },
};

const TH: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 10, fontWeight: 700,
  color: "rgba(255,255,255,0.50)",
  letterSpacing: "0.1em", textAlign: "left",
};

export default function JobsListClient({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const { visible, toggle } = useColumnVisibility("jobs-table-cols", JOB_COLUMNS);

  const counts: Record<string, number> = {
    all:    jobs.length,
    draft:  jobs.filter(j => j.status === "draft").length,
    active: jobs.filter(j => j.status === "active").length,
    paused: jobs.filter(j => j.status === "paused").length,
    closed: jobs.filter(j => j.status === "closed").length,
  };

  const filtered = jobs.filter(j => {
    const matchesFilter = activeFilter === "all" || j.status === activeFilter;
    const matchesSearch = !search.trim() || j.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
    <div>
      {/* ── STATUS TILES ── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
          Status Overview · {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
          {STATUS_CONFIG.map((cfg) => {
            const Icon = cfg.icon;
            const isActive = activeFilter === cfg.key;
            return (
              <button
                key={cfg.key}
                onClick={() => setActiveFilter(cfg.key)}
                style={{
                  flexShrink: 0, minWidth: 108, background: "#fff",
                  border: isActive ? `2px solid ${cfg.accent}` : "2px solid rgba(28,56,41,0.07)",
                  borderRadius: 10, padding: "14px 14px 12px",
                  cursor: "pointer", position: "relative", overflow: "hidden",
                  textAlign: "left", outline: "none", transition: "all 0.17s ease",
                  boxShadow: isActive
                    ? `0 0 0 1px ${cfg.accent}20, 0 6px 20px ${cfg.accent}18`
                    : "0 1px 6px rgba(28,56,41,0.06)",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: cfg.accent, borderRadius: "8px 8px 0 0" }} />
                <div style={{ marginBottom: 10, marginTop: 4 }}>
                  <Icon style={{ width: 15, height: 15, color: cfg.accent }} />
                </div>
                <p style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, color: DARK, marginBottom: 5 }}>
                  {counts[cfg.key] ?? 0}
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.08em" }}>{cfg.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH + CUSTOMISE ── */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginBottom: 16 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "0 14px", boxShadow: "0 1px 4px rgba(28,56,41,0.05)",
        }}>
          <Search style={{ width: 15, height: 15, color: MUTED, flexShrink: 0 }} />
          <input
            type="text" placeholder="Search / Filters"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: "12px 0", background: "none", border: "none", outline: "none", fontSize: 13, color: DARK }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: "4px 2px", fontSize: 13 }}>✕</button>
          )}
        </div>
        <ColumnCustomizer columns={JOB_COLUMNS} visible={visible} onToggle={toggle} />
      </div>

      {/* ── TABLE ── */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, textAlign: "center", padding: "60px 40px", boxShadow: "0 2px 12px rgba(28,56,41,0.06)" }}>
          <div style={{ display: "inline-flex", padding: 18, borderRadius: "50%", background: "rgba(28,56,41,0.06)", border: `1px solid ${BORDER}`, marginBottom: 14 }}>
            <Briefcase style={{ width: 22, height: 22, color: MUTED }} />
          </div>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>
            {search ? `No jobs match "${search}"` : `No ${activeFilter === "all" ? "" : activeFilter + " "}jobs yet.`}
          </p>
          {!search && activeFilter === "all" && (
            <Link href="/jobs/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: DARK, color: "#fff", padding: "9px 18px", borderRadius: 100, fontWeight: 600, fontSize: 13, textDecoration: "none", marginTop: 12 }}>
              <Plus style={{ width: 13, height: 13 }} /> Create Job
            </Link>
          )}
        </div>
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 16px rgba(28,56,41,0.07)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Jobs">
              <thead>
                <tr style={{ background: "#172F22" }}>
                  <th style={{ ...TH, width: 48, textAlign: "center" }}>#</th>
                  <th style={TH}>JOB TITLE</th>
                  {visible.client && <th style={TH}>CLIENT</th>}
                  {visible.category && <th style={TH}>CATEGORY</th>}
                  {visible.type && <th style={TH}>TYPE</th>}
                  {visible.priority && <th style={TH}>PRIORITY</th>}
                  {visible.status && <th style={TH}>STATUS</th>}
                  {visible.experience && <th style={TH}>EXPERIENCE</th>}
                  {visible.positions && <th style={TH}>POSITIONS</th>}
                  {visible.location && <th style={TH}>LOCATION</th>}
                  {visible.candidates && <th style={{ ...TH, textAlign: "center" }}>CANDIDATES</th>}
                  {visible.created && <th style={TH}>CREATED</th>}
                  <th style={{ ...TH, width: 64 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((job, idx) => {
                  const candidateCount = job.candidates?.[0]?.count ?? 0;
                  const st = STATUS_STYLE[job.status] ?? STATUS_STYLE.draft;
                  const accentColor = STATUS_CONFIG.find(c => c.key === job.status)?.accent ?? "#9CA3AF";
                  const pr = PRIORITY_STYLE[job.priority ?? "P2"] ?? PRIORITY_STYLE.P2;
                  const expStr = (job.experience_min != null && job.experience_max != null)
                    ? `${job.experience_min}–${job.experience_max} yrs`
                    : job.experience_min != null ? `${job.experience_min}+ yrs`
                    : "—";

                  return (
                    <tr
                      key={job.id}
                      style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer", transition: "background 0.13s" }}
                      className="hover:bg-emerald-50/40 group"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      {/* # */}
                      <td style={{ padding: "14px 8px", textAlign: "center", position: "relative" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accentColor, borderRadius: "0 2px 2px 0" }} />
                        <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{idx + 1}</span>
                      </td>

                      {/* Title */}
                      <td style={{ padding: "14px 14px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: DARK }} className="group-hover:text-emerald-700 transition-colors">
                          {job.title}
                        </span>
                      </td>

                      {/* Client */}
                      {visible.client && (
                        <td style={{ padding: "14px 14px", fontSize: 12, color: MID, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {job.client ?? <span style={{ color: "rgba(28,56,41,0.2)" }}>—</span>}
                        </td>
                      )}

                      {/* Category */}
                      {visible.category && (
                        <td style={{ padding: "14px 14px" }}>
                          {job.category ? (
                            <span style={{
                              fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 99,
                              background: "rgba(99,102,241,0.08)", color: "#6366F1",
                              border: "1px solid rgba(99,102,241,0.15)",
                              whiteSpace: "nowrap",
                            }}>
                              {job.category}
                            </span>
                          ) : <span style={{ color: "rgba(28,56,41,0.2)", fontSize: 12 }}>—</span>}
                        </td>
                      )}

                      {/* Type */}
                      {visible.type && (
                        <td style={{ padding: "14px 14px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
                            background: "rgba(28,56,41,0.07)", color: MID,
                            border: "1px solid rgba(28,56,41,0.12)",
                          }}>
                            {job.job_type ?? "FTE"}
                          </span>
                        </td>
                      )}

                      {/* Priority */}
                      {visible.priority && (
                        <td style={{ padding: "14px 14px" }}>
                          {job.priority ? (
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                              background: pr.bg, color: pr.color,
                            }}>
                              {job.priority}
                            </span>
                          ) : <span style={{ color: "rgba(28,56,41,0.2)", fontSize: 12 }}>—</span>}
                        </td>
                      )}

                      {/* Status */}
                      {visible.status && (
                        <td style={{ padding: "14px 14px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                            whiteSpace: "nowrap",
                          }}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </td>
                      )}

                      {/* Experience */}
                      {visible.experience && (
                        <td style={{ padding: "14px 14px", fontSize: 12, color: MID, whiteSpace: "nowrap" }}>
                          {expStr}
                        </td>
                      )}

                      {/* Positions */}
                      {visible.positions && (
                        <td style={{ padding: "14px 14px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            minWidth: 24, height: 24, borderRadius: 99,
                            background: "rgba(28,56,41,0.07)", color: DARK,
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {job.positions ?? 1}
                          </span>
                        </td>
                      )}

                      {/* Location */}
                      {visible.location && (
                        <td style={{ padding: "14px 14px", fontSize: 12, color: MID, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.location ?? <span style={{ color: "rgba(28,56,41,0.2)" }}>—</span>}
                        </td>
                      )}

                      {/* Candidates */}
                      {visible.candidates && (
                        <td style={{ padding: "14px 14px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Users style={{ width: 13, height: 13, color: candidateCount > 0 ? "#059669" : "#DC2626" }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: candidateCount > 0 ? "#059669" : "#DC2626" }}>
                              {candidateCount}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Created */}
                      {visible.created && (
                        <td style={{ padding: "14px 14px", fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>
                          {formatDate(job.created_at)}
                        </td>
                      )}

                      {/* Actions */}
                      <td style={{ padding: "14px 10px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                          <button
                            onClick={(e) => handleDelete(e, job.id)}
                            disabled={deleting === job.id}
                            aria-label={`Delete ${job.title}`}
                            style={{ padding: 7, borderRadius: 7, background: "none", border: "none", color: MUTED, cursor: "pointer", transition: "all 0.13s", opacity: deleting === job.id ? 0.4 : 1 }}
                            className="hover:bg-red-50 hover:!text-red-500"
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                          <div style={{ padding: 7, color: "rgba(28,56,41,0.2)" }} className="group-hover:!text-emerald-500">
                            <ArrowRight style={{ width: 13, height: 13 }} />
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
          <div style={{ padding: "10px 20px", borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, background: "rgba(28,56,41,0.02)" }}>
            Showing {filtered.length} of {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
