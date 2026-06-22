import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Briefcase, Users, CheckCircle2, Plus, ArrowRight, TrendingUp, Mic, FileText, BarChart2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Job = { id: string; title: string; status: string; created_at: string; client?: string | null; category?: string | null };

const C = {
  dark:   "#1C3829",
  mid:    "#3D6B54",
  muted:  "#7A9E8E",
  lime:   "#B8E04A",
  bg:     "#F8F5EE",
  border: "rgba(28,56,41,0.09)",
  card:   "#FFFFFF",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs").select("*")
    .eq("created_by", user!.id).order("created_at", { ascending: false });

  const { data: candidateStats } = await supabase
    .from("candidates").select("status, jobs!inner(created_by)").eq("jobs.created_by", user!.id);

  const allJobs: Job[] = jobs ?? [];
  const totalCandidates = candidateStats?.length ?? 0;
  const completedCount  = candidateStats?.filter(c => c.status === "completed").length ?? 0;
  const activeJobs      = allJobs.filter(j => j.status === "active").length;

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100%" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: C.dark, marginBottom: 4, lineHeight: 1.1 }}>
            Good to see you 👋
          </h1>
          <p style={{ fontSize: 13, color: C.muted }}>Here&apos;s your hiring overview.</p>
        </div>
        <Link href="/jobs/new" className="dash-new-job-btn" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: C.dark, color: "#fff",
          padding: "10px 20px", borderRadius: 100,
          fontWeight: 600, fontSize: 13, textDecoration: "none",
          boxShadow: "0 4px 16px rgba(28,56,41,0.22)",
        }}>
          <Plus style={{ width: 14, height: 14 }} />
          New Job
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Jobs"           value={allJobs.length} icon={Briefcase}    accent="#6366F1" />
        <StatCard label="Active Jobs"          value={activeJobs}      icon={TrendingUp}   accent="#10B981" />
        <StatCard label="Total Candidates"     value={totalCandidates} icon={Users}        accent="#3B82F6" />
        <StatCard label="Completed Interviews" value={completedCount}  icon={CheckCircle2} accent="#8B5CF6" />
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { icon: Briefcase, label: "Post a new job",   sub: "Create role, add criteria & questions",  href: "/jobs/new",           dark: false },
          { icon: Users,     label: "View candidates",  sub: "See all screened candidates",             href: "/candidates",          dark: false },
          { icon: Mic,       label: "Active jobs",      sub: "Roles currently accepting interviews",    href: "/jobs",               dark: true  },
        ].map((a, i) => {
          const Icon = a.icon;
          return (
            <Link key={i} href={a.href} className="dash-action-card" style={{
              gap: 14,
              background: a.dark ? C.dark : C.card,
              border: `1px solid ${a.dark ? C.dark : C.border}`,
              borderRadius: 14, padding: "18px 20px",
              boxShadow: "0 2px 10px rgba(28,56,41,0.05)",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: a.dark ? `${C.lime}25` : "rgba(28,56,41,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 18, height: 18, color: a.dark ? C.lime : C.mid }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: a.dark ? "#fff" : C.dark, marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: a.dark ? "rgba(255,255,255,0.5)" : C.muted }}>{a.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Main 2-col layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

        {/* Jobs table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(28,56,41,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileText style={{ width: 15, height: 15, color: C.muted }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Recent Jobs</h2>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, background: "rgba(28,56,41,0.06)", borderRadius: 99, padding: "2px 8px" }}>{allJobs.length}</span>
            </div>
            <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: C.mid, textDecoration: "none" }}>
              View all <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {allJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 40px" }}>
              <div style={{ display: "inline-flex", padding: 18, borderRadius: "50%", background: "rgba(28,56,41,0.05)", border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <Briefcase style={{ width: 24, height: 24, color: C.muted }} />
              </div>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>No jobs yet. Create your first one.</p>
              <Link href="/jobs/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.dark, color: "#fff", padding: "10px 20px", borderRadius: 100, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                <Plus style={{ width: 14, height: 14 }} /> Create Job
              </Link>
            </div>
          ) : (
            <div>
              {allJobs.slice(0, 8).map((job, idx) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="dash-job-row" style={{
                  textDecoration: "none", display: "flex",
                  alignItems: "center", justifyContent: "space-between",
                  padding: "13px 22px",
                  borderBottom: idx < Math.min(allJobs.length, 8) - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>{job.title}</span>
                      {job.client && <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{job.client}</span>}
                      {job.category && <span style={{ fontSize: 11, color: "#6366F1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 99, padding: "1px 7px", fontWeight: 600 }}>{job.category}</span>}
                    </div>
                    <span style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "block" }}>{formatDate(job.created_at)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
                    <StatusBadge status={job.status} />
                    <ArrowRight style={{ width: 13, height: 13, color: "rgba(28,56,41,0.2)" }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Activity snapshot */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(28,56,41,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <BarChart2 style={{ width: 15, height: 15, color: C.muted }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Activity</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Total candidates",      value: totalCandidates, max: Math.max(totalCandidates, 1), color: "#3B82F6" },
                { label: "Completed interviews",  value: completedCount,  max: Math.max(totalCandidates, 1), color: "#10B981" },
                { label: "Active jobs",           value: activeJobs,      max: Math.max(allJobs.length, 1),  color: "#6366F1" },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.mid, fontWeight: 500 }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{r.value}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(28,56,41,0.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: r.color, width: `${(r.value / r.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How Charlie helps */}
          <div style={{ background: C.dark, borderRadius: 16, padding: "22px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>How Charlie helps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: Mic,          label: "Runs voice interviews",    sub: "Natural, consistent, 24/7"   },
                { icon: FileText,     label: "Scores across 5 axes",     sub: "Auto-report in under 60s"    },
                { icon: CheckCircle2, label: "Checks role-fit criteria", sub: "Against what they said"      },
                { icon: TrendingUp,   label: "Ranks candidates",         sub: "Deterministic shortlist"     },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${C.lime}18`, border: `1px solid ${C.lime}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 14, height: 14, color: C.lime }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <Link href="/jobs/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.lime, color: C.dark, padding: "11px 0", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                <Plus style={{ width: 14, height: 14 }} />
                Post a job
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon: Icon }: { label: string; value: number; accent: string; icon: React.ElementType }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px", position: "relative", overflow: "hidden", boxShadow: "0 2px 10px rgba(28,56,41,0.04)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "14px 14px 0 0" }} />
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon style={{ width: 17, height: 17, color: accent }} />
      </div>
      <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, color: C.dark, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    draft:  { bg: "rgba(28,56,41,0.05)", color: C.muted,    border: C.border                      },
    active: { bg: "rgba(16,185,129,0.08)", color: "#059669", border: "rgba(16,185,129,0.18)"       },
    paused: { bg: "rgba(245,158,11,0.08)", color: "#D97706", border: "rgba(245,158,11,0.18)"       },
    closed: { bg: "rgba(239,68,68,0.07)",  color: "#DC2626", border: "rgba(239,68,68,0.15)"        },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
