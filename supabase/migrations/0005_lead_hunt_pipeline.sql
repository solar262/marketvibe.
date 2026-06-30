create extension if not exists "uuid-ossp";

alter table internal_marketing_leads
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
    select 1 from pg_constraint where conname = 'internal_marketing_leads_status_check'
  ) then
    alter table internal_marketing_leads
      add constraint internal_marketing_leads_status_check
      check (status in ('new', 'reviewed', 'replied', 'follow_up', 'not_fit', 'closed'));
  end if;
end $$;

create table if not exists lead_hunt_runs (
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

create table if not exists lead_hunt_events (
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

create table if not exists lead_hunt_processed_urls (
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
  on lead_hunt_processed_urls(run_id, source_url);

create index if not exists lead_hunt_runs_updated_at_idx
  on lead_hunt_runs(updated_at desc);

create index if not exists lead_hunt_events_created_at_idx
  on lead_hunt_events(created_at desc);

create index if not exists internal_marketing_leads_status_idx
  on internal_marketing_leads(status);

alter table lead_hunt_runs enable row level security;
alter table lead_hunt_events enable row level security;
alter table lead_hunt_processed_urls enable row level security;
