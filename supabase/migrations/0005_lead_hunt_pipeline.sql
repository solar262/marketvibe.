create extension if not exists "uuid-ossp";
create schema if not exists public;
set search_path = public;

create table if not exists public.internal_marketing_leads (
  id uuid primary key default uuid_generate_v4(),
  source text not null default 'lead_hunt_autopilot',
  platform text not null default 'facebook',
  label text not null,
  fit_rank integer not null default 0,
  run_id uuid,
  group_name text,
  score integer not null default 0,
  post_text text not null,
  source_name text,
  author text,
  date_text text,
  source_url text,
  query_used text,
  source_used text,
  pain_point text,
  intent_reason text,
  reply_draft text,
  outreach_mode text,
  status text not null default 'new',
  outreach_status text not null default 'new',
  analysis jsonb not null default '{}',
  raw_data jsonb not null default '{}',
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.internal_marketing_leads
  add column if not exists run_id uuid,
  add column if not exists group_name text,
  add column if not exists score integer not null default 0,
  add column if not exists intent_reason text,
  add column if not exists status text not null default 'new',
  add column if not exists outreach_status text not null default 'new',
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'internal_marketing_leads_status_check'
      and n.nspname = 'public'
      and t.relname = 'internal_marketing_leads'
  ) then
    alter table public.internal_marketing_leads
      add constraint internal_marketing_leads_status_check
      check (status in ('new', 'reviewed', 'replied', 'follow_up', 'not_fit', 'closed'));
  end if;
end $$;

create unique index if not exists internal_marketing_leads_source_url_idx
  on public.internal_marketing_leads(source_url)
  where source_url is not null and source_url <> '';

create index if not exists internal_marketing_leads_imported_at_idx
  on public.internal_marketing_leads(imported_at desc);

create index if not exists internal_marketing_leads_fit_rank_idx
  on public.internal_marketing_leads(fit_rank desc);

alter table public.internal_marketing_leads enable row level security;

create table if not exists public.lead_hunt_runs (
  id uuid primary key default uuid_generate_v4(),
  active boolean not null default false,
  paused boolean not null default false,
  status text not null default 'Ready.',
  current_query text,
  current_source text,
  current_url text,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  duplicate_count integer not null default 0,
  failed_count integer not null default 0,
  searches_run integer not null default 0,
  config jsonb not null default '{}',
  errors jsonb not null default '[]',
  extension_version text,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stopped_at timestamptz
);

create table if not exists public.lead_hunt_events (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid,
  event_type text not null,
  message text,
  reason text,
  source_url text,
  query text,
  score integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.lead_hunt_processed_urls (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid,
  source_url text not null,
  status text not null,
  reason text,
  query text,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lead_hunt_processed_urls_run_url_idx
  on public.lead_hunt_processed_urls(run_id, source_url);

create index if not exists lead_hunt_runs_updated_at_idx
  on public.lead_hunt_runs(updated_at desc);

create index if not exists lead_hunt_events_created_at_idx
  on public.lead_hunt_events(created_at desc);

create index if not exists internal_marketing_leads_status_idx
  on public.internal_marketing_leads(status);

alter table public.lead_hunt_runs enable row level security;
alter table public.lead_hunt_events enable row level security;
alter table public.lead_hunt_processed_urls enable row level security;
