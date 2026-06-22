import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil, CalendarDays, Users, BookOpen, Building2, ListChecks, Trophy } from "lucide-react";
import CandidateTable from "@/components/recruiter/CandidateTable";
import SendInviteModal from "@/components/recruiter/SendInviteModal";
import { formatDate } from "@/lib/utils";

type ScreeningQuestion = { id: string; question: string; question_type: string; order_index: number };

type CriterionResult = { criterion: string; status: "met" | "unmet" | "unconfirmed"; evidence: string | null };

type CandidateRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  interview_tokens: { token: string; expires_at: string; used_at: string | null }[];
  interviews: {
    id: string;
    status: string;
    duration_secs: number | null;
    completed_at: string | null;
    evaluations: {
      overall_score: number;
      recommendation: string;
      communication_score: number;
      criteria_results: CriterionResult[] | null;
    } | null;
  }[];
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
    .from("jobs")
    .select("*, screening_questions(*)")
    .eq("id", id)
    .eq("created_by", user!.id)
    .single();

  if (!job) notFound();

  const { data: candidates } = await supabase
    .from("candidates")
    .select(`
      *,
      interview_tokens(token, expires_at, used_at),
      interviews(id, status, duration_secs, completed_at,
        evaluations(overall_score, recommendation, communication_score, criteria_results)
      )
    `)
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const questions = ((job.screening_questions as ScreeningQuestion[]) ?? [])
    .sort((a, b) => a.order_index - b.order_index);
  const candidateList = (candidates as CandidateRow[]) ?? [];

  const candidateRanks = computeRanks(candidateList);
  const rankedCount = Object.keys(candidateRanks).length;
  const topCandidate = rankedCount > 0
    ? candidateList.find(c => candidateRanks[c.id] === 1)
    : null;

  return (
    <div style={{ padding: "28px 32px" }} className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Created {formatDate(job.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline" size="sm" aria-label="Edit job">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <SendInviteModal jobId={id} jobTitle={job.title} />
        </div>
      </div>

      {/* ── Job Details card ── */}
      <div className="glass-card p-6 space-y-5">
        {job.description ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Job Description</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        ) : null}

        {job.description && job.company_intro ? <Separator /> : null}

        {job.company_intro ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Company Introduction</h3>
              <span className="text-xs text-muted-foreground/60 italic">— read aloud by Charlie at interview start</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.company_intro}</p>
          </div>
        ) : null}

        {!job.description && !job.company_intro && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground/60">No description or company intro added.</p>
            <Link href={`/jobs/${id}/edit`} className="text-xs text-primary hover:underline mt-1 inline-block">Add details →</Link>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left sidebar */}
        <div className="col-span-1 space-y-4">

          {/* Role Fit Criteria */}
          {(job.role_criteria as string[])?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Role Fit Criteria</h3>
              <ol className="space-y-2">
                {(job.role_criteria as string[]).map((c, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-foreground/80">
                    <span className="text-muted-foreground/40 font-mono text-xs shrink-0 tabular-nums mt-0.5">{i + 1}.</span>
                    {c}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Key Skills */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Skills</h3>
            {(job.key_skills as string[])?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(job.key_skills as string[]).map((s) => (
                  <span key={s} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/60">No skills defined</p>
            )}
          </div>

          {/* Screening Questions */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Screening Questions <span className="normal-case font-normal">({questions.length})</span>
              </h3>
            </div>
            {questions.length > 0 ? (
              <ol className="space-y-3">
                {questions.map((q, i) => (
                  <li key={q.id} className="flex gap-2.5">
                    <span className="text-muted-foreground/40 font-mono text-xs shrink-0 tabular-nums mt-0.5">{i + 1}.</span>
                    <div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{q.question}</p>
                      <span className="text-xs text-muted-foreground/50 mt-0.5 inline-block capitalize">{q.question_type}</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground/60">No questions configured</p>
            )}
          </div>
        </div>

        {/* Candidates table */}
        <div className="col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Candidates <span className="text-muted-foreground font-normal">({candidateList.length})</span>
                  </h3>
                  {rankedCount >= 2 && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      background: "rgba(184,224,74,0.15)", color: "#3D6B54",
                      border: "1px solid rgba(184,224,74,0.35)",
                      borderRadius: 99, padding: "2px 10px",
                    }}>
                      {rankedCount} ranked
                    </span>
                  )}
                </div>
                {topCandidate && rankedCount >= 2 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Trophy style={{ width: 13, height: 13, color: "#B45309" }} />
                    <span style={{ fontSize: 12, color: "#B45309", fontWeight: 600 }}>
                      Top pick: {topCandidate.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-2">
              <CandidateTable
                candidates={candidateList}
                jobId={id}
                appUrl={appUrl}
                candidateRanks={candidateRanks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft:  "bg-muted text-muted-foreground border-border",
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    closed: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] ?? styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
