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
  // Voice agent
  { key: "VOICE_PROVIDER", label: "Voice provider", group: "Voice agent", secret: false, placeholder: "pipecat | retell", help: "Which voice agent runs interviews." },
  { key: "TOM_BOT_URL", label: "Voice bot URL", group: "Voice agent", secret: false, placeholder: "http://localhost:7860", help: "URL of the Groq/Pipecat bot (used when provider = pipecat)." },
  { key: "BOT_WEBHOOK_SECRET", label: "Bot webhook secret", group: "Voice agent", secret: true, help: "Shared secret the bot sends when posting transcripts back." },
  { key: "TTS_PROVIDER", label: "TTS provider", group: "Voice agent", secret: false, placeholder: "deepgram | groq", help: "Text-to-speech engine for the bot. Defaults to Deepgram when a Deepgram key is set." },
  { key: "DEEPGRAM_API_KEY", label: "Deepgram API key", group: "Voice agent", secret: true, placeholder: "Token ...", help: "Deepgram Aura TTS — far higher quota than Groq's free TTS. Get one at deepgram.com." },
  { key: "GROQ_LLM_MODEL", label: "Interviewer model", group: "Voice agent", secret: false, placeholder: "llama-3.3-70b-versatile | llama-3.1-8b-instant", help: "Groq model the live interviewer uses. Blank = 70b (quality). Use 8b for lower latency / unlimited request count." },

  // AI analysis
  { key: "ANALYSIS_PROVIDER", label: "Analysis provider", group: "AI analysis", secret: false, placeholder: "anthropic | groq | ollama" },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic API key", group: "AI analysis", secret: true, placeholder: "sk-ant-..." },
  { key: "GROQ_API_KEY", label: "Groq API key", group: "AI analysis", secret: true, placeholder: "gsk_...", help: "Used for Groq analysis and passed to the voice bot." },

  // Retell (fallback voice provider)
  { key: "RETELL_API_KEY", label: "Retell API key", group: "Retell (fallback)", secret: true, placeholder: "key_..." },
  { key: "RETELL_AGENT_ID", label: "Retell agent ID", group: "Retell (fallback)", secret: false, placeholder: "agent_..." },
  { key: "RETELL_WEBHOOK_SECRET", label: "Retell webhook secret", group: "Retell (fallback)", secret: true },

  // Email
  { key: "RESEND_API_KEY", label: "Resend API key", group: "Email", secret: true, placeholder: "re_..." },
  { key: "EMAIL_FROM", label: "From address", group: "Email", secret: false, placeholder: "charlie@yourdomain.com" },
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
