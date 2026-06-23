-- What the screening interview should cover, configured per job.
-- Values: screening_questions | technical | behavioural | company_briefing
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS interview_coverage TEXT[]
  DEFAULT '{screening_questions,behavioural,company_briefing}';
