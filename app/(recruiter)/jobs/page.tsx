import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import JobsListClient from "@/components/recruiter/JobsListClient";

type Job = {
  id: string;
  title: string;
  status: string;
  key_skills: string[];
  created_at: string;
  candidates: { count: number }[];
};

const DARK  = "#1C3829";
const MUTED = "#7A9E8E";

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, candidates(count)")
    .eq("created_by", user!.id)
    .order("created_at", { ascending: false });

  const allJobs: Job[] = (jobs as Job[]) ?? [];

  return (
    <div className="rpad-x" style={{ padding: "28px 32px" }}>

      {/* ── Page header ── */}
      <div className="rstack" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, lineHeight: 1 }}>
              Active Job Listings
            </h1>
            <span style={{
              background: "rgba(28,56,41,0.08)", color: DARK,
              fontSize: 11, fontWeight: 700, padding: "2px 8px",
              borderRadius: 99, border: "1px solid rgba(28,56,41,0.14)",
            }}>
              {allJobs.length}
            </span>
          </div>
          <p style={{ fontSize: 13, color: MUTED }}>Manage, review, and track all open positions in one place.</p>
        </div>
        <Link href="/jobs/new" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: DARK, color: "#fff",
          padding: "10px 20px", borderRadius: 100,
          fontWeight: 600, fontSize: 13, textDecoration: "none",
          boxShadow: "0 4px 16px rgba(28,56,41,0.25)",
          flexShrink: 0,
        }}>
          <Plus style={{ width: 14, height: 14 }} />
          New Job
        </Link>
      </div>

      {/* ── Interactive tiles + table ── */}
      <JobsListClient jobs={allJobs} />
    </div>
  );
}
