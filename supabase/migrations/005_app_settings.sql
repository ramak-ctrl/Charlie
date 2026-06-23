-- ── App settings (admin-managed API keys & integration config) ───────────────
-- Global key/value store. Values override the corresponding environment variable
-- at runtime (see lib/settings.ts). Read/written only via the service role from
-- the admin-gated /api/settings route, so RLS denies all direct client access.

create table if not exists app_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

alter table app_settings enable row level security;
-- No policies: only the service role (which bypasses RLS) may read/write these.
