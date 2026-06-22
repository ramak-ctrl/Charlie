-- Role fit criteria: stored on the job, results on the evaluation
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS role_criteria TEXT[] DEFAULT '{}';

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS criteria_results JSONB DEFAULT '[]';
