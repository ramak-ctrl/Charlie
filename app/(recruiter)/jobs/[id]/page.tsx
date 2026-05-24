import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import CandidateTable from "@/components/recruiter/CandidateTable";
import SendInviteModal from "@/components/recruiter/SendInviteModal";
import InlineCompanyIntro from "@/components/recruiter/InlineCompanyIntro";
import { formatDate } from "@/lib/utils";

type ScreeningQuestion = { id: string; question: string; order_index: number };
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-muted-foreground text-sm">Created {formatDate(job.created_at)}</p>
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

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Skills</h3>
            {(job.key_skills as string[])?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(job.key_skills as string[]).map((s) => (
                  <span key={s} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills defined</p>
            )}
          </div>

          <div className="glass-card p-5">
            <InlineCompanyIntro jobId={id} initial={job.company_intro ?? ""} />
          </div>

          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Screening Questions ({(job.screening_questions as ScreeningQuestion[])?.length ?? 0})
            </h3>
            <ol className="space-y-2.5">
              {((job.screening_questions as ScreeningQuestion[]) ?? [])
                .sort((a, b) => a.order_index - b.order_index)
                .map((q, i) => (
                  <li key={q.id} className="text-sm text-muted-foreground flex gap-2.5">
                    <span className="text-muted-foreground/40 font-mono shrink-0 tabular-nums">{i + 1}.</span>
                    <span className="leading-relaxed">{q.question}</span>
                  </li>
                ))}
            </ol>
          </div>
        </div>

        <div className="col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <h3 className="text-sm font-semibold text-foreground">
                Candidates ({(candidates as CandidateRow[])?.length ?? 0})
              </h3>
            </div>
            <div className="p-2">
              <CandidateTable
                candidates={(candidates as CandidateRow[]) ?? []}
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
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    closed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] ?? styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
