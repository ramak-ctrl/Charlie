import { createClient } from "@/lib/supabase/server";
import CandidatesListClient from "@/components/recruiter/CandidatesListClient";
import AddCandidateButton from "@/components/recruiter/AddCandidateButton";

type CriterionResult = { criterion: string; status: "met" | "unmet" | "unconfirmed"; evidence: string | null };

export type CandidateRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  notice_period: string | null;
  current_location: string | null;
  current_ctc: string | null;
  expected_ctc: string | null;
  linkedin_url: string | null;
  primary_skills: string[];
  created_at: string;
  job_id: string;
  jobs: { id: string; title: string } | null;
  interviews: {
    id: string;
    status: string;
    duration_secs: number | null;
    completed_at: string | null;
    evaluations: {
      overall_score: number;
      communication_score: number | null;
      criteria_results: CriterionResult[] | null;
    } | null;
  }[];
};

const DARK  = "#1C3829";
const MUTED = "#7A9E8E";

/* Rank within each job group — same algorithm as job detail page */
function computeAllRanks(candidates: CandidateRow[]): Record<string, number> {
  const byJob: Record<string, CandidateRow[]> = {};
  for (const c of candidates) {
    const key = c.jobs?.id ?? "__none__";
    (byJob[key] = byJob[key] ?? []).push(c);
  }
  const ranks: Record<string, number> = {};
  for (const group of Object.values(byJob)) {
    const evaluated = group.filter(c => c.interviews?.[0]?.evaluations != null);
    if (evaluated.length < 2) continue;
    const sorted = [...evaluated].sort((a, b) => {
      const aEv = a.interviews[0].evaluations!;
      const bEv = b.interviews[0].evaluations!;
      const aMet = (aEv.criteria_results ?? []).filter(r => r.status === "met").length;
      const bMet = (bEv.criteria_results ?? []).filter(r => r.status === "met").length;
      if (bMet !== aMet) return bMet - aMet;
      if (bEv.overall_score !== aEv.overall_score) return bEv.overall_score - aEv.overall_score;
      return (bEv.communication_score ?? 0) - (aEv.communication_score ?? 0);
    });
    sorted.forEach((c, i) => { ranks[c.id] = i + 1; });
  }
  return ranks;
}

export default async function CandidatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("candidates")
    .select(`
      *,
      jobs!inner(id, title, created_by),
      interviews(
        id, status, duration_secs, completed_at,
        evaluations(*)
      )
    `)
    .eq("jobs.created_by", user!.id)
    .order("created_at", { ascending: false });

  const candidates: CandidateRow[] = ((data as CandidateRow[]) ?? []).map((c: CandidateRow) => ({
    ...c,
    interviews: Array.isArray(c.interviews) ? c.interviews : [],
  }));

  const candidateRanks = computeAllRanks(candidates);

  // Open positions for the "Add candidate" job dropdown.
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("created_by", user!.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const openJobs = (jobsData as { id: string; title: string }[]) ?? [];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, lineHeight: 1 }}>
              All Candidates
            </h1>
            <span style={{ background: "rgba(28,56,41,0.08)", color: DARK, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(28,56,41,0.14)" }}>
              {candidates.length}
            </span>
          </div>
          <p style={{ fontSize: 13, color: MUTED }}>All candidates screened by Charlie across your job listings.</p>
        </div>
        <AddCandidateButton jobs={openJobs} />
      </div>

      <CandidatesListClient candidates={candidates} candidateRanks={candidateRanks} />
    </div>
  );
}
