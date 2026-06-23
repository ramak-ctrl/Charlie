"use client";
import { useMemo, useState } from "react";
import type { SettingStatus } from "@/lib/settings";

const DARK = "#1C3829";
const MID = "#3D6B54";
const MUTED = "#7A9E8E";
const BORDER = "rgba(28,56,41,0.09)";

export default function ApiKeysSettings({ initialSettings }: { initialSettings: SettingStatus[] }) {
  const [settings, setSettings] = useState<SettingStatus[]>(initialSettings);
  // Input drafts: secrets start empty (placeholder shows masked); non-secrets prefill with current value.
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const s of initialSettings) d[s.key] = s.secret ? "" : s.preview;
    return d;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, SettingStatus[]>();
    for (const s of settings) {
      if (!m.has(s.group)) m.set(s.group, []);
      m.get(s.group)!.push(s);
    }
    return Array.from(m.entries());
  }, [settings]);

  function setDraft(key: string, val: string) {
    setDrafts((d) => ({ ...d, [key]: val }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);

    // Build the update set: secrets only when the admin typed something; non-secrets
    // when the value changed from what's currently shown.
    const updates: Record<string, string> = {};
    for (const s of settings) {
      const draft = drafts[s.key] ?? "";
      if (s.secret) {
        if (draft !== "") updates[s.key] = draft;
      } else if (draft !== s.preview) {
        updates[s.key] = draft;
      }
    }

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      setMsg({ kind: "ok", text: "Nothing to update." });
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Save failed");
      }
      const data = await res.json();
      setSettings(data.settings as SettingStatus[]);
      // Reset secret inputs (they're saved now); keep non-secret drafts in sync.
      const next: Record<string, string> = {};
      for (const s of data.settings as SettingStatus[]) next[s.key] = s.secret ? "" : s.preview;
      setDrafts(next);
      setMsg({ kind: "ok", text: `Saved ${data.updated.length} setting${data.updated.length === 1 ? "" : "s"}.` });
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const sourceBadge = (s: SettingStatus) => {
    const map = {
      db: { text: "Saved", bg: "rgba(184,224,74,0.18)", color: "#3D6B54" },
      env: { text: "From env", bg: "rgba(28,56,41,0.06)", color: MUTED },
      none: { text: "Not set", bg: "rgba(200,60,60,0.10)", color: "#b04a3a" },
    } as const;
    const b = map[s.source];
    return (
      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: b.bg, color: b.color }}>
        {b.text}
      </span>
    );
  };

  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: DARK, letterSpacing: "-0.2px" }}>API Keys &amp; Integrations</h2>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
          Saved values override environment variables at runtime. Secrets are write-only — leave a secret blank to keep it unchanged.
        </p>
      </div>

      <div style={{ padding: "8px 24px 20px" }}>
        {groups.map(([group, items]) => (
          <div key={group} style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              {group}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((s) => (
                <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label htmlFor={s.key} style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{s.label}</label>
                    {sourceBadge(s)}
                  </div>
                  <input
                    id={s.key}
                    type={s.secret ? "password" : "text"}
                    value={drafts[s.key] ?? ""}
                    onChange={(e) => setDraft(s.key, e.target.value)}
                    placeholder={s.secret && s.preview ? s.preview : s.placeholder ?? ""}
                    autoComplete="off"
                    spellCheck={false}
                    style={{
                      fontSize: 13, padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${BORDER}`, background: "#fff", color: DARK,
                      fontFamily: s.secret ? "monospace" : "inherit", outline: "none",
                    }}
                  />
                  {s.help && <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{s.help}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              fontSize: 13, fontWeight: 700, color: "#fff", background: saving ? MUTED : DARK,
              border: "none", borderRadius: 8, padding: "9px 18px", cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {msg && (
            <span style={{ fontSize: 12, fontWeight: 600, color: msg.kind === "ok" ? "#3D6B54" : "#b04a3a" }}>
              {msg.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
