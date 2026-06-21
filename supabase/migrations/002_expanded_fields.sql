-- Migration 002: Add expanded fields to jobs and candidates tables

-- ── Jobs: new columns ──────────────────────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS job_type     TEXT    DEFAULT 'FTE'
    CHECK (job_type IN ('C2H', 'FTE', 'D2H')),
  ADD COLUMN IF NOT EXISTS experience_min INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS experience_max INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS notice_period TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS positions    INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS location     TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS priority     TEXT    DEFAULT 'P2'
    CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  ADD COLUMN IF NOT EXISTS expiry_date  DATE    DEFAULT NULL;

-- ── Candidates: new columns ────────────────────────────────────────────────
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS experience          TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS relevant_experience TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notice_period       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_ctc         TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expected_ctc        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_location    TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS linkedin_url        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_skills      TEXT[]  DEFAULT '{}';
