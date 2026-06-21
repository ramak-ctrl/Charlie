import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, CheckCircle2, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Job = { id: string; title: string; status: string; created_at: string };

const STAT_DEFS = [
  { label: "Total Jobs",           accent: "#6366F1", glow: "rgba(99,102,241,0.3)",  glowClass: "glow-indigo",  icon: Briefcase  },
  { label: "Active Jobs",          accent: "#10B981", glow: "rgba(16,185,129,0.25)", glowClass: "glow-emerald", icon: TrendingUp },
  { label: "Total Candidates",     accent: "#3B82F6", glow: "rgba(59,130,246,0.25)", glowClass: "glow-blue",    icon: Users      },
  { label: "Completed Interviews", accent: "#8B5CF6", glow: "rgba(139,92,246,0.3)",  glowClass: "glow-violet",  icon: CheckCircle2 },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs").select("id, title, status, created_at")
    .eq("created_by", user!.id).order("created_at", { ascending: false });

  const { data: candidateStats } = await supabase
    .from("candidates").select("status, jobs!inner(created_by)").eq("jobs.created_by", user!.id);

  const allJobs: Job[] = jobs ?? [];
  const statValues = [
    allJobs.length,
    allJobs.filter((j) => j.status === "active").length,
    candidateStats?.length ?? 0,
    candidateStats?.filter((c) => c.status === "completed").length ?? 0,
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "#fff", marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Welcome back. Here&apos;s your hiring overview.</p>
        </div>
        <Link href="/jobs/new">
          <Button style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)", border: "1px solid rgba(124,58,237,0.6)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)", borderRadius: 10, fontWeight: 600, height: 40, paddingLeft: 18, paddingRight: 18 }}>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_DEFS.map((s, i) => (
          <StatCard key={s.label} {...s} value={statValues[i]} />
        ))}
      </div>

      {/* ── Recent Jobs ── */}
      <div className="glass-card overflow-hidden">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Recent Jobs</h2>
          <Link href="/jobs">
            <Button variant="ghost" size="sm" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", gap: 4 }} className="hover:text-white/70 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {allJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 40px" }}>
            <div style={{ display: "inline-flex", padding: 18, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
              <Briefcase style={{ width: 24, height: 24, color: "rgba(255,255,255,0.25)" }} />
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>No jobs yet. Create your first one.</p>
            <Link href="/jobs/new">
              <Button size="sm" style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)", border: "1px solid rgba(124,58,237,0.5)" }}>
                <Plus className="mr-2 h-4 w-4" /> Create Job
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            {allJobs.slice(0, 8).map((job, idx) => (
              <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 24px",
                    borderBottom: idx < Math.min(allJobs.length, 8) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    transition: "background 0.15s",
                  }}
                  className="hover:bg-white/[0.025] group"
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }} className="group-hover:text-violet-300 transition-colors">{job.title}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{formatDate(job.created_at)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusBadge status={job.status} />
                    <ArrowRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.2)" }} className="group-hover:text-white/50 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, glow, glowClass, icon: Icon }: {
  label: string; value: number; accent: string; glow: string; glowClass: string; icon: React.ElementType;
}) {
  return (
    <div
      className={`glass-card ${glowClass}`}
      style={{ padding: "22px 20px", position: "relative", overflow: "hidden" }}
    >
      {/* Top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      {/* Corner ambient glow */}
      <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, background: glow, borderRadius: "50%", filter: "blur(24px)", pointerEvents: "none" }} />

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 11, marginBottom: 16,
        background: `linear-gradient(135deg, ${accent}28, ${accent}10)`,
        border: `1px solid ${accent}28`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 18, height: 18, color: accent }} />
      </div>

      {/* Value */}
      <p style={{
        fontSize: 38, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1,
        background: `linear-gradient(135deg, #ffffff 30%, ${accent})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        marginBottom: 6,
      }}>
        {value}
      </p>

      {/* Label */}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    draft:  { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",  border: "rgba(255,255,255,0.1)"  },
    active: { bg: "rgba(16,185,129,0.12)",  color: "#34D399",                border: "rgba(16,185,129,0.25)"  },
    paused: { bg: "rgba(245,158,11,0.12)",  color: "#FBBF24",                border: "rgba(245,158,11,0.25)"  },
    closed: { bg: "rgba(239,68,68,0.12)",   color: "#F87171",                border: "rgba(239,68,68,0.25)"   },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
