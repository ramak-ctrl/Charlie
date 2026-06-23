import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

// ── Editable settings metadata ────────────────────────────────────────────────
// Each entry is a key the admin can manage from Settings. `value` resolution at
// runtime: app_settings row (if non-empty) → process.env[key] → "".

export interface SettingDef {
  key: string;
  label: string;
  group: string;
  secret: boolean;
  placeholder?: string;
  help?: string;
}

export const EDITABLE_SETTINGS: SettingDef[] = [
  // The keys you actually manage. Other config (voice provider, bot URL, TTS
  // provider, Retell keys, etc.) is handled via environment variables / sensible
  // defaults and intentionally kept off this page.
  { key: "GROQ_API_KEY", label: "Groq API key", group: "API Keys", secret: true, placeholder: "gsk_...", help: "Powers the voice interviewer (LLM + speech-to-text). Get one at console.groq.com." },
  { key: "DEEPGRAM_API_KEY", label: "Deepgram API key", group: "API Keys", secret: true, placeholder: "Token ...", help: "Text-to-speech for the interviewer (Deepgram Aura). Get one at deepgram.com." },
  { key: "GEMINI_API_KEY", label: "Gemini API key", group: "API Keys", secret: true, placeholder: "AIza...", help: "Google Gemini — free, high-quality interview analysis. Get one at aistudio.google.com." },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic API key", group: "API Keys", secret: true, placeholder: "sk-ant-...", help: "Claude — analyzes interviews. Optional; paid per use." },
  { key: "RESEND_API_KEY", label: "Resend API key", group: "API Keys", secret: true, placeholder: "re_...", help: "Sends candidate interview-invite emails. Optional." },

  // A couple of non-secret config fields.
  { key: "ANALYSIS_PROVIDER", label: "Analysis provider", group: "Configuration", secret: false, placeholder: "gemini | groq | anthropic", help: "Which engine writes interview reports. Blank = auto (Gemini → Anthropic → Groq)." },
  { key: "EMAIL_FROM", label: "Invite from-address", group: "Configuration", secret: false, placeholder: "charlie@yourdomain.com", help: "From address for invite emails." },
  { key: "GROQ_LLM_MODEL", label: "Interviewer model", group: "Configuration", secret: false, placeholder: "llama-3.3-70b-versatile | llama-3.1-8b-instant", help: "Blank = 70b (quality). Use llama-3.1-8b-instant for lower latency." },
];

const EDITABLE_KEYS = new Set(EDITABLE_SETTINGS.map((s) => s.key));

// ── Runtime reads ─────────────────────────────────────────────────────────────

let cache: { at: number; map: Record<string, string> } | null = null;
const CACHE_MS = 5000;

async function loadAll(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.map;
  const map: Record<string, string> = {};
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase.from("app_settings").select("key, value");
    for (const row of data ?? []) {
      if (typeof row.value === "string" && row.value !== "") map[row.key] = row.value;
    }
  } catch {
    // table missing or DB unreachable → fall back to env only
  }
  cache = { at: Date.now(), map };
  return map;
}

/** Resolve a setting: DB value (if non-empty) → fallback → process.env[key] → "". */
export async function getSetting(key: string, fallback?: string): Promise<string> {
  const map = await loadAll();
  if (map[key]) return map[key];
  if (fallback != null && fallback !== "") return fallback;
  return process.env[key] ?? "";
}

export function clearSettingsCache() {
  cache = null;
}

// ── Admin read/write (used by /api/settings) ──────────────────────────────────

export interface SettingStatus extends SettingDef {
  isSet: boolean;
  source: "db" | "env" | "none";
  preview: string; // masked for secrets, plain for non-secrets
}

function mask(value: string, secret: boolean): string {
  if (!value) return "";
  if (!secret) return value;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}

/** Status of every editable setting, with secrets masked. Never returns raw secrets. */
export async function getSettingsStatus(): Promise<SettingStatus[]> {
  const dbMap = await loadAll();
  return EDITABLE_SETTINGS.map((def) => {
    const dbVal = dbMap[def.key] ?? "";
    const envVal = process.env[def.key] ?? "";
    const effective = dbVal || envVal;
    const source: SettingStatus["source"] = dbVal ? "db" : envVal ? "env" : "none";
    return {
      ...def,
      isSet: !!effective,
      source,
      preview: mask(effective, def.secret),
    };
  });
}

/** Upsert settings. Empty string clears the override (falls back to env). */
export async function saveSettings(
  updates: Record<string, string>,
  updatedBy: string | null
): Promise<{ updated: string[] }> {
  const supabase = await createServiceClient();
  const rows = Object.entries(updates)
    .filter(([key]) => EDITABLE_KEYS.has(key))
    .map(([key, value]) => ({
      key,
      value: value ?? "",
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    }));

  if (rows.length) {
    await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
  }
  clearSettingsCache();
  return { updated: rows.map((r) => r.key) };
}
