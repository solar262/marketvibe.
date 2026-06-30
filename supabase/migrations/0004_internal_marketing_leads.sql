create extension if not exists "uuid-ossp";

create table if not exists internal_marketing_leads (
  id uuid primary key default uuid_generate_v4(),
  source text not null default 'lead_hunt_autopilot',
  platform text not null default 'facebook',
  label text not null,
  fit_rank integer not null default 0,
  post_text text not null,
  source_name text,
  author text,
  date_text text,
  source_url text,
  query_used text,
  source_used text,
  pain_point text,
  reply_draft text,
  outreach_mode text,
  analysis jsonb not null default '{}',
  raw_data jsonb not null default '{}',
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists internal_marketing_leads_source_url_idx
  on internal_marketing_leads(source_url)
  where source_url is not null and source_url <> '';

create index if not exists internal_marketing_leads_imported_at_idx
  on internal_marketing_leads(imported_at desc);

create index if not exists internal_marketing_leads_fit_rank_idx
  on internal_marketing_leads(fit_rank desc);

alter table internal_marketing_leads enable row level security;
