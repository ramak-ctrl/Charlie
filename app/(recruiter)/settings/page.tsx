import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "#fff", marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Manage your account and preferences.</p>
      </div>

      <div className="space-y-4">

        {/* Account */}
        <div className="glass-card overflow-hidden">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Account</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Your account details</p>
          </div>
          <div style={{ padding: "8px 0" }}>
            {[
              { label: "Email", value: user?.email ?? "—" },
              { label: "Name",  value: profile?.full_name ?? "—" },
              { label: "Role",  value: profile?.role ?? "recruiter" },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 24px",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "capitalize" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="glass-card overflow-hidden">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Data &amp; Privacy</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>How candidate data is handled</p>
          </div>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Interview recordings and transcripts are retained for 90 days by default.",
              "Candidate PII is stored securely in Supabase and never shared with third parties.",
              "AI analysis is performed by Claude (Anthropic). Transcripts are sent to Anthropic for processing.",
              "Charlie never makes final hiring decisions — all recommendations require human confirmation.",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "rgba(167,139,250,0.7)", flexShrink: 0, marginTop: 1 }}>•</span>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="glass-card overflow-hidden">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Integrations</h2>
          </div>
          <div style={{ padding: "8px 0" }}>
            {[
              { label: "ATS Export",       badge: "CSV / JSON" },
              { label: "Phone Interviews",  badge: "Browser only (v1)" },
              { label: "Language",          badge: "English (v1)" },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 24px",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{row.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  {row.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
