-- MarketVibe internal Lead Hunt storage tables
-- Run this once in Supabase SQL Editor if Lead Hunt imports show counters but no stored leads.

create table if not exists public.internal_marketing_leads (
  id uuid primary key default gen_random_uuid(),
  run_id text,
  source text default 'lead_hunt_autopilot',
  platform text default 'facebook',
  label text,
  fit_rank integer,
  score integer,
  post_text text,
  source_name text,
  group_name text,
  author text,
  date_text text,
  source_url text unique,
  query_used text,
  source_used text,
  pain_point text,
  intent_reason text,
  reply_draft text,
  outreach_mode text,
  outreach_status text default 'new',
  status text default 'new',
  analysis jsonb,
  raw_data jsonb,
  imported_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists internal_marketing_leads_imported_at_idx on public.internal_marketing_leads (imported_at desc);
create index if not exists internal_marketing_leads_label_idx on public.internal_marketing_leads (label);
create index if not exists internal_marketing_leads_run_id_idx on public.internal_marketing_leads (run_id);

create table if not exists public.lead_hunt_runs (
  id text primary key,
  active boolean default false,
  paused boolean default false,
  status text,
  current_query text,
  current_source text,
  current_url text,
  imported_count integer default 0,
  skipped_count integer default 0,
  duplicate_count integer default 0,
  failed_count integer default 0,
  errors jsonb default '[]'::jsonb,
  extension_version text,
  updated_at timestamptz default now(),
  stopped_at timestamptz
);

create table if not exists public.lead_hunt_events (
  id uuid primary key default gen_random_uuid(),
  run_id text,
  event_type text not null,
  message text,
  reason text,
  source_url text,
  query text,
  score integer,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists lead_hunt_events_created_at_idx on public.lead_hunt_events (created_at desc);
create index if not exists lead_hunt_events_run_id_idx on public.lead_hunt_events (run_id);

create table if not exists public.lead_hunt_processed_urls (
  source_url text primary key,
  run_id text,
  status text,
  reason text,
  query text,
  score integer,
  updated_at timestamptz default now()
);

alter table public.internal_marketing_leads disable row level security;
alter table public.lead_hunt_runs disable row level security;
alter table public.lead_hunt_events disable row level security;
alter table public.lead_hunt_processed_urls disable row level security;
