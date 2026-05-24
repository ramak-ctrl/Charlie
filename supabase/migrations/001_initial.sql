-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Organizations ─────────────────────────────────────────────────────────
create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_at  timestamptz default now()
);

-- ── Profiles (recruiters) ─────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  org_id      uuid references organizations(id),
  email       text not null,
  full_name   text,
  role        text not null default 'recruiter',
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Jobs ─────────────────────────────────────────────────────────────────
create table jobs (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid references organizations(id),
  created_by      uuid references profiles(id),
  title           text not null,
  description     text,
  company_intro   text,
  key_skills      text[] default '{}',
  status          text not null default 'draft' check (status in ('draft', 'active', 'paused', 'closed')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── Screening Questions ───────────────────────────────────────────────────
create table screening_questions (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid references jobs(id) on delete cascade,
  question      text not null,
  question_type text not null default 'open' check (question_type in ('open', 'numeric', 'boolean', 'scale')),
  order_index   integer not null default 0,
  is_default    boolean default false,
  created_at    timestamptz default now()
);

-- ── Candidates ────────────────────────────────────────────────────────────
create table candidates (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid references jobs(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  status      text not null default 'invited' check (status in ('invited', 'started', 'completed', 'reviewed')),
  invited_at  timestamptz default now(),
  created_at  timestamptz default now()
);

-- ── Interview Tokens ──────────────────────────────────────────────────────
create table interview_tokens (
  id            uuid primary key default uuid_generate_v4(),
  candidate_id  uuid references candidates(id) on delete cascade,
  job_id        uuid references jobs(id) on delete cascade,
  token         uuid not null unique default uuid_generate_v4(),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  used_at       timestamptz,
  created_at    timestamptz default now()
);

-- ── Interviews ────────────────────────────────────────────────────────────
create table interviews (
  id              uuid primary key default uuid_generate_v4(),
  token_id        uuid references interview_tokens(id),
  candidate_id    uuid references candidates(id),
  job_id          uuid references jobs(id),
  retell_call_id  text,
  status          text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'failed', 'no_show')),
  recording_url   text,
  transcript      jsonb,
  duration_secs   integer,
  consent_given   boolean default false,
  created_at      timestamptz default now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

-- ── Evaluations ───────────────────────────────────────────────────────────
create table evaluations (
  id                      uuid primary key default uuid_generate_v4(),
  interview_id            uuid references interviews(id) on delete cascade unique,
  communication_score     integer check (communication_score between 1 and 10),
  seriousness_score       integer check (seriousness_score between 1 and 10),
  composure_score         integer check (composure_score between 1 and 10),
  professionalism_score   integer check (professionalism_score between 1 and 10),
  reliability_score       integer check (reliability_score between 1 and 10),
  overall_score           numeric(4,1),
  recommendation          text check (recommendation in ('strong_yes', 'yes', 'maybe', 'no')),
  summary                 text,
  strengths               text[],
  concerns                text[],
  evidence_quotes         jsonb default '{}',
  screening_data          jsonb default '{}',
  recruiter_confirmed     boolean default false,
  recruiter_notes         text,
  created_at              timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table screening_questions enable row level security;
alter table candidates enable row level security;
alter table interview_tokens enable row level security;
alter table interviews enable row level security;
alter table evaluations enable row level security;

-- Profiles: own row
create policy "users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Jobs: created_by user
create policy "recruiters can manage own jobs" on jobs
  for all using (auth.uid() = created_by);

-- Screening questions: via job ownership
create policy "recruiters can manage questions for own jobs" on screening_questions
  for all using (
    job_id in (select id from jobs where created_by = auth.uid())
  );

-- Candidates: via job ownership
create policy "recruiters can manage candidates for own jobs" on candidates
  for all using (
    job_id in (select id from jobs where created_by = auth.uid())
  );

-- Interview tokens: via job ownership
create policy "recruiters can read tokens for own jobs" on interview_tokens
  for select using (
    job_id in (select id from jobs where created_by = auth.uid())
  );
create policy "service role can manage tokens" on interview_tokens
  for all using (true) with check (true);

-- Interviews: via job ownership (recruiter) or public token check (candidate via service role)
create policy "recruiters can view interviews for own jobs" on interviews
  for select using (
    job_id in (select id from jobs where created_by = auth.uid())
  );

-- Evaluations: via interview → job ownership
create policy "recruiters can manage evaluations for own jobs" on evaluations
  for all using (
    interview_id in (
      select i.id from interviews i
      join jobs j on j.id = i.job_id
      where j.created_by = auth.uid()
    )
  );

-- ── Indexes ───────────────────────────────────────────────────────────────
create index idx_jobs_created_by on jobs(created_by);
create index idx_candidates_job_id on candidates(job_id);
create index idx_interviews_job_id on interviews(job_id);
create index idx_interviews_retell_call_id on interviews(retell_call_id);
create index idx_interview_tokens_token on interview_tokens(token);

-- ── Updated-at trigger ────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at();
