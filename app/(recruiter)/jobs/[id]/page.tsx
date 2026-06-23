import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, CalendarDays, Users, BookOpen, Building2, ListChecks, Trophy, Target, Sparkles, Mic } from "lucide-react";
import CandidateTable from "@/components/recruiter/CandidateTable";
import SendInviteModal from "@/components/recruiter/SendInviteModal";
import { formatDate } from "@/lib/utils";

type ScreeningQuestion = { id: string; question: string; question_type: string; order_index: number };
type CriterionResult = { criterion: string; status: "met" | "unmet" | "unconfirmed"; evidence: string | null };

type CandidateRow = {
  id: string; name: string; email: string; status: string; created_at: string;
  interview_tokens: { token: string; expires_at: string; used_at: string | null }[];
  interviews: {
    id: string; status: string; duration_secs: number | null; completed_at: string | null;
    evaluations: { overall_score: number; recommendation: string; communication_score: number; criteria_results: CriterionResult[] | null } | null;
  }[];
};

const C = {
  dark: "#1C3829", mid: "#3D6B54", muted: "#7A9E8E", lime: "#B8E04A",
  border: "rgba(28,56,41,0.09)", card: "#FFFFFF",
};

const CARD: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
  boxShadow: "0 2px 12px rgba(28,56,41,0.05)",
};

const COVERAGE_LABELS: Record<string, string> = {
  screening_questions: "Screening Questions",
  technical: "Technical Screening",
  behavioural: "Behavioural Screening",
  company_briefing: "Company Briefing",
};

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  draft:  { color: "#6B7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
  active: { color: "#059669", bg: "rgba(5,150,105,0.1)",   border: "rgba(5,150,105,0.2)"   },
  paused: { color: "#D97706", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.2)"   },
  closed: { color: "#DC2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.15)"  },
};

function computeRanks(candidates: CandidateRow[]): Record<string, number> {
  const evaluated = candidates.filter(c => c.interviews?.[0]?.evaluations != null);
  if (evaluated.length < 2) return {};
  const sorted = [...evaluated].sort((a, b) => {
    const aEv = a.interviews[0].evaluations!;
    const bEv = b.interviews[0].evaluations!;
    const aMet = (aEv.criteria_results ?? []).filter(r => r.status === "met").length;
    const bMet = (bEv.criteria_results ?? []).filter(r => r.status === "met").length;
    if (bMet !== aMet) return bMet - aMet;
    if (bEv.overall_score !== aEv.overall_score) return bEv.overall_score - aEv.overall_score;
    return (bEv.communication_score ?? 0) - (aEv.communication_score ?? 0);
  });
  const ranks: Record<string, number> = {};
  sorted.forEach((c, i) => { ranks[c.id] = i + 1; });
  return ranks;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs").select("*, screening_questions(*)").eq("id", id).eq("created_by", user!.id).single();
  if (!job) notFound();

  const { data: candidates } = await supabase
    .from("candidates")
    .select(`*, interview_tokens(token, expires_at, used_at), interviews(id, status, duration_secs, completed_at, evaluations(*))`)
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const questions = ((job.screening_questions as ScreeningQuestion[]) ?? []).sort((a, b) => a.order_index - b.order_index);
  const candidateList = (candidates as CandidateRow[]) ?? [];
  const candidateRanks = computeRanks(candidateList);
  const rankedCount = Object.keys(candidateRanks).length;
  const topCandidate = rankedCount > 0 ? candidateList.find(c => candidateRanks[c.id] === 1) : null;

  const st = STATUS_STYLE[job.status] ?? STATUS_STYLE.draft;
  const skills = (job.key_skills as string[]) ?? [];
  const criteria = (job.role_criteria as string[]) ?? [];
  const coverage = (job.interview_coverage as string[]) ?? [];

  const expStr = job.experience_min != null && job.experience_max != null
    ? `${job.experience_min}–${job.experience_max} yrs`
    : job.experience_min != null ? `${job.experience_min}+ yrs` : null;

  const meta: { label: string; value: React.ReactNode }[] = [
    { label: "Type", value: job.job_type },
    { label: "Client", value: job.client },
    { label: "Category", value: job.category },
    { label: "Priority", value: job.priority },
    { label: "Positions", value: job.positions },
    { label: "Experience", value: expStr },
    { label: "Location", value: job.location },
    { label: "Notice period", value: job.notice_period },
    { label: "Account manager", value: job.account_manager },
    { label: "Expiry", value: job.expiry_date ? formatDate(job.expiry_date) : null },
    { label: "Start date", value: job.expected_start_date ? formatDate(job.expected_start_date) : null },
  ].filter(m => m.value != null && m.value !== "");

  return (
    <div style={{ padding: "28px 32px" }} className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: 5 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", color: C.dark, lineHeight: 1 }}>{job.title}</h1>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 11px", borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: C.muted, fontSize: 13 }}>
            <CalendarDays style={{ width: 14, height: 14 }} />
            <span>Created {formatDate(job.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/jobs/${id}/edit`} style={{
            display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none",
            background: "#fff", border: `1px solid ${C.border}`, color: C.mid,
            padding: "9px 16px", borderRadius: 100, fontWeight: 600, fontSize: 13,
          }}>
            <Pencil style={{ width: 14, height: 14 }} /> Edit
          </Link>
          <SendInviteModal jobId={id} jobTitle={job.title} jobCoverage={job.interview_coverage ?? undefined} />
        </div>
      </div>

      {/* ── Overview facts ── */}
      {meta.length > 0 && (
        <div style={{ ...CARD, padding: "6px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {meta.map((m, i) => (
              <div key={m.label} style={{ padding: "12px 16px", borderRight: `1px solid ${C.border}`, borderBottom: i < meta.length - 1 ? "none" : "none" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Description + Company intro ── */}
      {(job.description || job.company_intro) && (
        <div className="grid grid-cols-2 gap-5">
          {job.description && (
            <div style={{ ...CARD, padding: 22 }} className={job.company_intro ? "" : "col-span-2"}>
              <SectionHeader icon={BookOpen} title="Job Description" />
              <p style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.75, whiteSpace: "pre-wrap", marginTop: 12 }}>{job.description}</p>
            </div>
          )}
          {job.company_intro && (
            <div style={{ ...CARD, padding: 22 }} className={job.description ? "" : "col-span-2"}>
              <SectionHeader icon={Building2} title="Company Introduction" hint="Read by Charlie at interview start" />
              <p style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.75, whiteSpace: "pre-wrap", marginTop: 12 }}>{job.company_intro}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Main: reference (left) + candidates (right) ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left reference column */}
        <div className="col-span-1 space-y-5">

          {/* Key Skills */}
          <div style={{ ...CARD, padding: 20 }}>
            <SectionHeader icon={Sparkles} title="Key Skills" />
            <div style={{ marginTop: 12 }}>
              {skills.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {skills.map((s) => (
                    <span key={s} style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: "rgba(184,224,74,0.15)", color: C.mid, border: "1px solid rgba(184,224,74,0.4)" }}>{s}</span>
                  ))}
                </div>
              ) : <Empty>No skills defined</Empty>}
            </div>
          </div>

          {/* Role Fit Criteria */}
          {criteria.length > 0 && (
            <div style={{ ...CARD, padding: 20 }}>
              <SectionHeader icon={Target} title="Role Fit Criteria" />
              <ol style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9 }}>
                {criteria.map((c, i) => (
                  <li key={i} style={{ display: "flex", gap: 9, fontSize: 13, color: C.mid, lineHeight: 1.5 }}>
                    <span style={{ color: C.muted, fontWeight: 700, fontSize: 11, marginTop: 1 }}>{i + 1}.</span>{c}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Interview Coverage */}
          <div style={{ ...CARD, padding: 20 }}>
            <SectionHeader icon={Mic} title="Interview Coverage" />
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(coverage.length ? coverage : ["screening_questions", "behavioural", "company_briefing"]).map((k) => (
                <span key={k} style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: "rgba(28,56,41,0.06)", color: C.mid, border: `1px solid ${C.border}` }}>
                  {COVERAGE_LABELS[k] ?? k}
                </span>
              ))}
            </div>
          </div>

          {/* Screening Questions */}
          <div style={{ ...CARD, padding: 20 }}>
            <SectionHeader icon={ListChecks} title={`Screening Questions (${questions.length})`} />
            <div style={{ marginTop: 12 }}>
              {questions.length > 0 ? (
                <ol style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions.map((q, i) => (
                    <li key={q.id} style={{ display: "flex", gap: 9 }}>
                      <span style={{ color: C.muted, fontWeight: 700, fontSize: 11, marginTop: 2 }}>{i + 1}.</span>
                      <div>
                        <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.5 }}>{q.question}</p>
                        <span style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>{q.question_type}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <Empty>No questions configured</Empty>}
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="col-span-2">
          <div style={{ ...CARD, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users style={{ width: 16, height: 16, color: C.muted }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>
                  Candidates <span style={{ color: C.muted, fontWeight: 400 }}>({candidateList.length})</span>
                </h3>
                {rankedCount >= 2 && (
                  <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(184,224,74,0.15)", color: C.mid, border: "1px solid rgba(184,224,74,0.35)", borderRadius: 99, padding: "2px 10px" }}>
                    {rankedCount} ranked
                  </span>
                )}
              </div>
              {topCandidate && rankedCount >= 2 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Trophy style={{ width: 13, height: 13, color: "#B45309" }} />
                  <span style={{ fontSize: 12, color: "#B45309", fontWeight: 600 }}>Top pick: {topCandidate.name}</span>
                </div>
              )}
            </div>
            <div style={{ padding: 8 }}>
              <CandidateTable candidates={candidateList} jobId={id} appUrl={appUrl} candidateRanks={candidateRanks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon style={{ width: 15, height: 15, color: C.mid }} />
      <h3 style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{title}</h3>
      {hint && <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>· {hint}</span>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: C.muted }}>{children}</p>;
}
