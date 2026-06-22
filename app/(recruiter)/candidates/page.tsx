import { createClient } from "@/lib/supabase/server";
import CandidatesListClient from "@/components/recruiter/CandidatesListClient";

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
  jobs: { id: string; title: string } | null;
  interviews: {
    id: string;
    status: string;
    duration_secs: number | null;
    completed_at: string | null;
    evaluations: { overall_score: number; recommendation: string } | null;
  }[];
};

const DARK  = "#1C3829";
const MUTED = "#7A9E8E";

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
        evaluations(overall_score, recommendation)
      )
    `)
    .eq("jobs.created_by", user!.id)
    .order("created_at", { ascending: false });

  const candidates: CandidateRow[] = ((data as CandidateRow[]) ?? []).map((c: CandidateRow) => ({
    ...c,
    interviews: Array.isArray(c.interviews) ? c.interviews : [],
  }));

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, lineHeight: 1 }}>
            All Candidates
          </h1>
          <span style={{
            background: "rgba(28,56,41,0.08)", color: DARK,
            fontSize: 11, fontWeight: 700, padding: "2px 8px",
            borderRadius: 99, border: "1px solid rgba(28,56,41,0.14)",
          }}>
            {candidates.length}
          </span>
        </div>
        <p style={{ fontSize: 13, color: MUTED }}>
          All candidates screened by Charlie across your job listings.
        </p>
      </div>

      <CandidatesListClient candidates={candidates} />
    </div>
  );
}
