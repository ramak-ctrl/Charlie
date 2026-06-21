import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Briefcase, Users, CheckCircle2, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Job = { id: string; title: string; status: string; created_at: string };

const DARK  = "#1C3829";
const MID   = "#3D6B54";
const MUTED = "#7A9E8E";
const LIME  = "#B8E04A";
const BORDER = "rgba(28,56,41,0.09)";

const STAT_DEFS = [
  { label: "Total Jobs",           icon: Briefcase,   accent: "#6366F1", glow: "glow-indigo"  },
  { label: "Active Jobs",          icon: TrendingUp,  accent: "#10B981", glow: "glow-emerald" },
  { label: "Total Candidates",     icon: Users,       accent: "#3B82F6", glow: "glow-blue"    },
  { label: "Completed Interviews", icon: CheckCircle2,accent: "#8B5CF6", glow: "glow-violet"  },
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
    <div style={{ padding: "28px 32px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, marginBottom: 2 }}>
            Welcome back 👋
          </h1>
          <p style={{ fontSize: 13, color: MUTED }}>Here&apos;s your hiring overview.</p>
        </div>
        <Link href="/jobs/new" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: DARK, color: "#fff",
          padding: "10px 20px", borderRadius: 100,
          fontWeight: 600, fontSize: 13, textDecoration: "none",
          boxShadow: "0 4px 16px rgba(28,56,41,0.25)",
        }}>
          <Plus style={{ width: 14, height: 14 }} />
          New Job
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {STAT_DEFS.map((s, i) => (
          <StatCard key={s.label} {...s} value={statValues[i]} />
        ))}
      </div>

      {/* ── Recent Jobs ── */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: DARK }}>Recent Jobs</h2>
          <Link href="/jobs" style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 12, fontWeight: 600, color: MID, textDecoration: "none",
          }} className="hover:text-green-900 transition-colors">
            View all <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </div>

        {allJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 40px" }}>
            <div style={{ display: "inline-flex", padding: 18, borderRadius: "50%", background: "rgba(28,56,41,0.06)", border: `1px solid ${BORDER}`, marginBottom: 16 }}>
              <Briefcase style={{ width: 24, height: 24, color: MUTED }} />
            </div>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>No jobs yet. Create your first one.</p>
            <Link href="/jobs/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: DARK, color: "#fff", padding: "10px 20px", borderRadius: 100, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              <Plus style={{ width: 14, height: 14 }} /> Create Job
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
                    borderBottom: idx < Math.min(allJobs.length, 8) - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                  className="hover:bg-green-50/60 group transition-colors"
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: DARK }} className="group-hover:text-green-700 transition-colors">{job.title}</p>
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{formatDate(job.created_at)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusBadge status={job.status} />
                    <ArrowRight style={{ width: 14, height: 14, color: "rgba(28,56,41,0.25)" }} className="group-hover:text-green-600 transition-colors" />
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

function StatCard({ label, value, accent, glow, icon: Icon }: {
  label: string; value: number; accent: string; glow: string; icon: React.ElementType;
}) {
  return (
    <div className={`glass-card ${glow}`} style={{ padding: "22px 20px", position: "relative", overflow: "hidden" }}>
      {/* Top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "16px 16px 0 0" }} />

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 11, marginBottom: 16,
        background: `${accent}18`,
        border: `1px solid ${accent}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 18, height: 18, color: accent }} />
      </div>

      {/* Value */}
      <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, color: "#1C3829", marginBottom: 6 }}>
        {value}
      </p>

      {/* Label */}
      <p style={{ fontSize: 12, color: "#7A9E8E", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    draft:  { bg: "rgba(28,56,41,0.06)",  color: "#3D6B54",  border: "rgba(28,56,41,0.12)"  },
    active: { bg: "rgba(16,185,129,0.1)", color: "#059669",  border: "rgba(16,185,129,0.2)" },
    paused: { bg: "rgba(245,158,11,0.1)", color: "#D97706",  border: "rgba(245,158,11,0.2)" },
    closed: { bg: "rgba(239,68,68,0.08)", color: "#DC2626",  border: "rgba(239,68,68,0.15)" },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
