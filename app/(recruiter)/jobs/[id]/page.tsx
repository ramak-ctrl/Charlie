import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil, CalendarDays, Users, BookOpen, Building2, ListChecks } from "lucide-react";
import CandidateTable from "@/components/recruiter/CandidateTable";
import SendInviteModal from "@/components/recruiter/SendInviteModal";
import { formatDate } from "@/lib/utils";

type ScreeningQuestion = { id: string; question: string; question_type: string; order_index: number };
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
    evaluations: { overall_score: number; recommendation: string } | null;
  }[];
};

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
        evaluations(overall_score, recommendation)
      )
    `)
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const questions = ((job.screening_questions as ScreeningQuestion[]) ?? [])
    .sort((a, b) => a.order_index - b.order_index);
  const candidateList = (candidates as CandidateRow[]) ?? [];

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
        {/* Description */}
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

        {/* Company Intro */}
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
            <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Candidates <span className="text-muted-foreground font-normal">({candidateList.length})</span>
              </h3>
            </div>
            <div className="p-2">
              <CandidateTable
                candidates={candidateList}
                jobId={id}
                appUrl={appUrl}
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
