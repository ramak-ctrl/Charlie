-- ─────────────────────────────────────────────────────────────────────────────
-- Bring an existing Charlie database up to date. Safe to run multiple times
-- (every statement is idempotent). Run in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 004: role-fit criteria (job) + results (evaluation)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS role_criteria TEXT[] DEFAULT '{}';
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS criteria_results JSONB DEFAULT '[]';

-- 005: admin-managed app settings (API keys / config)
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 006: per-job interview coverage (what the voice bot covers)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS interview_coverage TEXT[]
  DEFAULT '{screening_questions,technical,behavioural,company_briefing}';

-- 007: per-interview-link coverage override
ALTER TABLE interview_tokens
  ADD COLUMN IF NOT EXISTS interview_coverage TEXT[];
