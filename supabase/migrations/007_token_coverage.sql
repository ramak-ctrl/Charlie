-- Per-interview-link coverage: each generated interview link can specify what the
-- voice bot should cover (overrides the job default). NULL/empty falls back to the job.
ALTER TABLE interview_tokens
  ADD COLUMN IF NOT EXISTS interview_coverage TEXT[];
