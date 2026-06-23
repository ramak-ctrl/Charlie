"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const DARK = "#1C3829";
const MID = "#3D6B54";
const MUTED = "#7A9E8E";
const BORDER = "rgba(28,56,41,0.12)";

type Job = { id: string; title: string };

export default function AddCandidateButton({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobId, setJobId] = useState("");
  const [screening, setScreening] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setName(""); setEmail(""); setJobId(""); setScreening(true);
    setError(""); setLink(null); setCopied(false); setSaving(false);
  }
  function close() { setOpen(false); reset(); router.refresh(); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !jobId) {
      setError("Name, email, and a job are all required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, job_id: jobId, screening }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to add candidate");

      if (screening && data.interviewLink) {
        setLink(data.interviewLink); // show the link; keep modal open
      } else {
        close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add candidate");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontSize: 14, padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${BORDER}`, background: "#fff", color: DARK, outline: "none", width: "100%",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: DARK, marginBottom: 5, display: "block" };

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: DARK, color: "#fff",
          padding: "10px 20px", borderRadius: 100,
          fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(28,56,41,0.25)", flexShrink: 0,
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        Add Candidate
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, background: "rgba(16,28,22,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460,
              boxShadow: "0 20px 60px rgba(16,28,22,0.25)", overflow: "hidden",
            }}
          >
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: DARK, letterSpacing: "-0.3px" }}>Add candidate</h2>
              <button onClick={close} style={{ background: "none", border: "none", fontSize: 20, color: MUTED, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {link ? (
              <div style={{ padding: "22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ color: "#2e7d32", fontSize: 18 }}>✓</span>
                  <p style={{ fontSize: 14, fontWeight: 600, color: DARK }}>Candidate added — screening link ready</p>
                </div>
                <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Share this link with the candidate to start their screening interview:</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input readOnly value={link} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }} onFocus={(e) => e.target.select()} />
                  <button
                    onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: DARK, border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={close} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: DARK, border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer" }}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" autoFocus />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
                </div>
                <div>
                  <label style={labelStyle}>Job (open positions) *</label>
                  <select style={inputStyle} value={jobId} onChange={(e) => setJobId(e.target.value)}>
                    <option value="">Select a job…</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  {jobs.length === 0 && <p style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>No open positions found. Create/activate a job first.</p>}
                </div>
                <div>
                  <label style={labelStyle}>Screening round</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map((opt) => (
                      <button
                        key={opt.l} type="button" onClick={() => setScreening(opt.v)}
                        style={{
                          flex: 1, fontSize: 13, fontWeight: 600, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                          border: `1px solid ${screening === opt.v ? DARK : BORDER}`,
                          background: screening === opt.v ? DARK : "#fff",
                          color: screening === opt.v ? "#fff" : MID,
                        }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>
                    {screening ? "A screening interview link will be generated and shown." : "No interview link will be created."}
                  </p>
                </div>

                {error && <p style={{ fontSize: 12, color: "#b04a3a", fontWeight: 600 }}>{error}</p>}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                  <button type="button" onClick={close} style={{ fontSize: 13, fontWeight: 600, color: MID, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: DARK, border: "none", borderRadius: 8, padding: "9px 18px", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Adding…" : "Add candidate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
