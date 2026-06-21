-- Add Staffmatic-matched fields to jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS client              TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category            TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expected_start_date DATE    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS publish_on_careers  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_manager     TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS must_have_skills    TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nice_to_have_skills TEXT    DEFAULT NULL;
