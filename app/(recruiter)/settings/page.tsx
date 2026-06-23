import { createClient } from "@/lib/supabase/server";
import { getSettingsStatus } from "@/lib/settings";
import ApiKeysSettings from "@/components/recruiter/ApiKeysSettings";

const DARK   = "#1C3829";
const MID    = "#3D6B54";
const MUTED  = "#7A9E8E";
const BORDER = "rgba(28,56,41,0.09)";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user!.id).single();

  const isAdmin = profile?.role === "admin";
  const settingsStatus = isAdmin ? await getSettingsStatus() : [];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.8px", color: DARK, marginBottom: 2 }}>Settings</h1>
        <p style={{ fontSize: 13, color: MUTED }}>Manage your account and preferences.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Account */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: DARK, letterSpacing: "-0.2px" }}>Account</h2>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Your account details</p>
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
                borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
              }}>
                <span style={{ fontSize: 13, color: MUTED }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: DARK, textTransform: "capitalize" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys (admin only) */}
        {isAdmin ? (
          <ApiKeysSettings initialSettings={settingsStatus} />
        ) : (
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: DARK, letterSpacing: "-0.2px" }}>API Keys &amp; Integrations</h2>
            </div>
            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontSize: 13, color: MID, lineHeight: 1.7 }}>
                Managing API keys requires an admin account. Ask an administrator to update credentials.
              </p>
            </div>
          </div>
        )}

        {/* Data & Privacy */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: DARK, letterSpacing: "-0.2px" }}>Data &amp; Privacy</h2>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>How candidate data is handled</p>
          </div>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Interview recordings and transcripts are retained for 90 days by default.",
              "Candidate PII is stored securely in Supabase and never shared with third parties.",
              "AI analysis is performed by Claude (Anthropic). Transcripts are sent to Anthropic for processing.",
              "Charlie never makes final hiring decisions — all recommendations require human confirmation.",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "#B8E04A", flexShrink: 0, marginTop: 1 }}>•</span>
                <p style={{ fontSize: 13, color: MID, lineHeight: 1.7 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: DARK, letterSpacing: "-0.2px" }}>Integrations</h2>
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
                borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
              }}>
                <span style={{ fontSize: 13, color: MID }}>{row.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                  background: "rgba(28,56,41,0.06)", color: MUTED,
                  border: `1px solid ${BORDER}`,
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
