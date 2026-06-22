"use client";
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, MessageSquareQuote, CheckCheck, XCircle, HelpCircle } from "lucide-react";
import type { Evaluation, Interview, Candidate, CriterionResult } from "@/lib/types";

const DARK   = "#1C3829";
const MID    = "#3D6B54";
const MUTED  = "#7A9E8E";
const BORDER = "rgba(28,56,41,0.09)";

interface Props {
  interviewId: string;
  onClose: () => void;
}

interface ReportData {
  interview: Interview & { candidates: Candidate };
  evaluation: Evaluation | null;
}

const AXES = [
  { key: "communication_score",   label: "Communication",   desc: "Clarity, articulation, structure"          },
  { key: "seriousness_score",     label: "Seriousness",     desc: "Preparation, engagement, depth"            },
  { key: "composure_score",       label: "Composure",       desc: "Handling pressure and ambiguity"           },
  { key: "professionalism_score", label: "Professionalism", desc: "Tone, courtesy, conduct"                   },
  { key: "reliability_score",     label: "Reliability",     desc: "Story consistency, specificity, self-eval gap" },
] as const;

const RECO_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; scoreBg: string }> = {
  strong_yes: { label: "Strong Yes", bg: "rgba(5,150,105,0.08)",  color: "#059669", border: "rgba(5,150,105,0.25)",  scoreBg: "rgba(5,150,105,0.15)"  },
  yes:        { label: "Yes",        bg: "rgba(59,130,246,0.08)", color: "#1D4ED8", border: "rgba(59,130,246,0.25)", scoreBg: "rgba(59,130,246,0.15)" },
  maybe:      { label: "Maybe",      bg: "rgba(217,119,6,0.08)",  color: "#B45309", border: "rgba(217,119,6,0.25)",  scoreBg: "rgba(217,119,6,0.15)"  },
  no:         { label: "No",         bg: "rgba(220,38,38,0.08)",  color: "#B91C1C", border: "rgba(220,38,38,0.25)",  scoreBg: "rgba(220,38,38,0.15)"  },
};

function scoreColor(score: number) {
  if (score >= 8) return "#059669";
  if (score >= 6) return "#1D4ED8";
  if (score >= 4) return "#B45309";
  return "#B91C1C";
}

function scoreBarColor(score: number) {
  if (score >= 8) return "#059669";
  if (score >= 6) return "#3B82F6";
  if (score >= 4) return "#D97706";
  return "#DC2626";
}

export default function EvaluationReport({ interviewId, onClose }: Props) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${interviewId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false));
  }, [interviewId]);

  const ev = data?.evaluation;
  const reco = ev ? (RECO_CONFIG[ev.recommendation] ?? RECO_CONFIG.maybe) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: DARK, fontSize: 18, fontWeight: 800 }}>
            Evaluation Report
          </DialogTitle>
          <DialogDescription style={{ color: MUTED, fontSize: 13 }}>
            {data?.interview?.candidates?.name ?? "Candidate"} · {formatDuration(data?.interview?.duration_secs ?? null)}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#B91C1C", padding: "12px 16px", borderRadius: 10, fontSize: 13 }}>
            {error}
          </div>
        )}

        {ev && reco && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 14 }}>

            {/* ── Recommendation Banner ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: reco.bg, border: `2px solid ${reco.border}`,
              borderRadius: 14, padding: "20px 24px",
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: reco.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, opacity: 0.8 }}>
                  Overall Recommendation
                </p>
                <p style={{ fontSize: 26, fontWeight: 800, color: reco.color, letterSpacing: "-0.5px" }}>
                  {reco.label}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: reco.color, opacity: 0.7, marginBottom: 4 }}>Overall Score</p>
                <div style={{
                  display: "inline-flex", alignItems: "baseline", gap: 3,
                  background: reco.scoreBg, borderRadius: 10, padding: "8px 16px",
                }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: reco.color, letterSpacing: "-1.5px", lineHeight: 1 }}>
                    {Number(ev.overall_score).toFixed(1)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: reco.color, opacity: 0.7 }}>/10</span>
                </div>
              </div>
            </div>

            {/* ── Role Fit ── */}
            {ev.criteria_results && ev.criteria_results.length > 0 && (
              <RoleFitSection criteria={ev.criteria_results as CriterionResult[]} />
            )}

            {/* ── Summary ── */}
            <div>
              <SectionTitle text="Summary" />
              <p style={{ color: MID, lineHeight: 1.75, fontSize: 14 }}>{ev.summary}</p>
            </div>

            <Divider />

            {/* ── 5-Axis Scores ── */}
            <div>
              <SectionTitle text="Evaluation Axes" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AXES.map(({ key, label, desc }) => {
                  const score = ev[key as keyof Evaluation] as number;
                  const axisKey = label.toLowerCase();
                  const quotes = ev.evidence_quotes?.[axisKey] ?? [];
                  const color = scoreColor(score);
                  const barColor = scoreBarColor(score);
                  return (
                    <div key={key} style={{
                      background: "#fff", border: `1px solid ${BORDER}`,
                      borderRadius: 12, padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: DARK, fontSize: 13 }}>{label}</span>
                          <span style={{ color: MUTED, fontSize: 12, marginLeft: 8 }}>{desc}</span>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, color, display: "inline-flex", alignItems: "baseline", gap: 2 }}>
                          {score}
                          <span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}>/10</span>
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ width: "100%", background: "rgba(28,56,41,0.08)", borderRadius: 99, height: 6, marginBottom: quotes.length > 0 ? 10 : 0 }}>
                        <div style={{ width: `${score * 10}%`, height: 6, background: barColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                      </div>
                      {quotes.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {quotes.slice(0, 2).map((q, i) => (
                            <div key={i} style={{
                              display: "flex", gap: 8, alignItems: "flex-start",
                              borderLeft: `2px solid ${BORDER}`, paddingLeft: 10,
                            }}>
                              <MessageSquareQuote style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2, color: MUTED }} />
                              <span style={{ fontSize: 12, color: MID, fontStyle: "italic", lineHeight: 1.6 }}>{q}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* ── Strengths & Concerns ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "rgba(5,150,105,0.05)", border: "1px solid rgba(5,150,105,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                <h3 style={{ fontWeight: 700, color: "#059669", fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 style={{ width: 15, height: 15 }} /> Strengths
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ev.strengths?.map((s, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, color: MID, fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0 }}>•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ background: "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                <h3 style={{ fontWeight: 700, color: "#B45309", fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle style={{ width: 15, height: 15 }} /> Concerns
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ev.concerns?.map((c, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, color: MID, fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: "#D97706", fontWeight: 700, flexShrink: 0 }}>•</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Divider />

            {/* ── Screening Data ── */}
            {ev.screening_data && Object.keys(ev.screening_data).length > 0 && (
              <div>
                <SectionTitle text="Screening Data" />
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                  {[
                    ev.screening_data.total_experience_years != null && { label: "Total Experience",    value: `${ev.screening_data.total_experience_years} yrs` },
                    ev.screening_data.relevant_experience_years != null && { label: "Relevant Experience", value: `${ev.screening_data.relevant_experience_years} yrs` },
                    ev.screening_data.notice_period && { label: "Notice Period",       value: String(ev.screening_data.notice_period) },
                    ev.screening_data.existing_offers != null && { label: "Existing Offers",    value: ev.screening_data.existing_offers ? "Yes" : "No" },
                    ev.screening_data.current_ctc && { label: "Current CTC",         value: String(ev.screening_data.current_ctc) },
                    ev.screening_data.expected_ctc && { label: "Expected CTC",        value: String(ev.screening_data.expected_ctc) },
                    ev.screening_data.current_location && { label: "Current Location",    value: String(ev.screening_data.current_location) },
                    ev.screening_data.open_to_relocate != null && { label: "Open to Relocate",   value: ev.screening_data.open_to_relocate ? "Yes" : "No" },
                  ].filter(Boolean).map((row, i, arr) => {
                    const r = row as { label: string; value: string };
                    return (
                      <div key={r.label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "11px 16px",
                        borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}>
                        <span style={{ fontSize: 13, color: MUTED }}>{r.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{r.value}</span>
                      </div>
                    );
                  })}
                </div>

                {ev.screening_data.skill_ratings && Object.keys(ev.screening_data.skill_ratings).length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      Self-rated Skills (1–5)
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(ev.screening_data.skill_ratings).map(([skill, rating]) => (
                        <div key={skill} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "#fff", border: `1px solid ${BORDER}`,
                          borderRadius: 99, padding: "5px 12px",
                        }}>
                          <span style={{ fontSize: 12, color: MID, fontWeight: 500 }}>{skill}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#6366F1" }}>{rating}/5</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Disclaimer ── */}
            <div style={{
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#92400E",
            }}>
              <strong>Note:</strong> This report is generated by AI. The final hiring decision must be made by a human recruiter.
            </div>
          </div>
        )}

        {!loading && !error && !ev && (
          <div style={{ textAlign: "center", padding: "40px 0", color: MUTED, fontSize: 14 }}>
            Analysis is being generated. Refresh in a moment.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleFitSection({ criteria }: { criteria: CriterionResult[] }) {
  const met         = criteria.filter(c => c.status === "met").length;
  const unmet       = criteria.filter(c => c.status === "unmet").length;
  const unconfirmed = criteria.filter(c => c.status === "unconfirmed");
  const total       = criteria.length;

  const STATUS_CFG = {
    met:          { icon: CheckCheck,  color: "#059669", bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.2)",  label: "Confirmed" },
    unmet:        { icon: XCircle,     color: "#B91C1C", bg: "rgba(220,38,38,0.06)",  border: "rgba(220,38,38,0.18)", label: "Not confirmed" },
    unconfirmed:  { icon: HelpCircle,  color: "#B45309", bg: "rgba(217,119,6,0.07)",  border: "rgba(217,119,6,0.2)",  label: "Not discussed" },
  };

  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`,
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        background: "rgba(28,56,41,0.03)",
        borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
            Role Fit
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: DARK, letterSpacing: "-0.5px" }}>
            Met <span style={{ color: met === total ? "#059669" : met >= total / 2 ? "#B45309" : "#B91C1C" }}>{met}</span> of {total} criteria
          </p>
        </div>
        {unconfirmed.length > 0 && (
          <div style={{
            fontSize: 12, color: "#92400E", background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8,
            padding: "6px 12px", maxWidth: 220, textAlign: "right", lineHeight: 1.5,
          }}>
            Probe further on: <strong>{unconfirmed.map(c => c.criterion).join(", ")}</strong>
          </div>
        )}
      </div>

      {/* Criteria list */}
      <div>
        {criteria.map((c, i) => {
          const cfg = STATUS_CFG[c.status];
          const Icon = cfg.icon;
          return (
            <div key={i} style={{
              padding: "12px 18px",
              borderBottom: i < criteria.length - 1 ? `1px solid ${BORDER}` : "none",
              background: cfg.bg,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 1,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: c.evidence ? 5 : 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{c.criterion}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: cfg.color,
                      background: "rgba(255,255,255,0.7)", border: `1px solid ${cfg.border}`,
                      borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap",
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                  {c.evidence && (
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <MessageSquareQuote style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2, color: MUTED }} />
                      <span style={{ fontSize: 12, color: MID, fontStyle: "italic", lineHeight: 1.6 }}>
                        &ldquo;{c.evidence}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      {unmet > 0 && (
        <div style={{
          padding: "10px 18px", borderTop: `1px solid ${BORDER}`,
          background: "rgba(28,56,41,0.02)",
          fontSize: 12, color: MUTED, fontStyle: "italic",
        }}>
          {unmet} criterion{unmet > 1 ? "a" : "on"} explicitly not confirmed by the candidate.
        </div>
      )}
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {text}
    </h3>
  );
}

function Divider() {
  return <div style={{ height: 1, background: BORDER }} />;
}
