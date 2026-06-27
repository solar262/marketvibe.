create extension if not exists "uuid-ossp";

create table if not exists search_runs (
  id uuid primary key default uuid_generate_v4(),
  country text not null,
  city text not null,
  business_type text not null,
  service_category text not null,
  source_status text not null check (source_status in ('live', 'demo')),
  status text not null default 'completed',
  source_note text,
  source_url text,
  result_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  search_run_id uuid references search_runs(id) on delete set null,
  external_id text,
  audit_slug text unique not null,
  source_status text not null check (source_status in ('live', 'demo')),
  business_name text not null,
  website text not null,
  contact_page_url text,
  public_email text,
  phone text,
  city text not null,
  country text not null,
  business_category text not null,
  google_profile_url text,
  social_links text[] not null default '{}',
  source text not null,
  source_url text,
  raw_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audits (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  search_run_id uuid references search_runs(id) on delete set null,
  audit_slug text unique not null,
  score integer not null default 0,
  priority text not null check (priority in ('low', 'medium', 'high')),
  page_title text,
  meta_description text,
  mobile_friendly boolean not null default false,
  page_speed text not null,
  ssl_present boolean not null default false,
  contact_form_present boolean not null default false,
  booking_button_present boolean not null default false,
  phone_visible boolean not null default false,
  email_visible boolean not null default false,
  social_links_visible boolean not null default false,
  reviews_visible boolean not null default false,
  clear_call_to_action_visible boolean not null default false,
  broken_links integer not null default 0,
  old_copyright_year integer,
  summary text not null,
  findings jsonb not null default '[]',
  issues jsonb not null default '[]',
  service_angle text not null,
  outreach_message text not null,
  subject_line text not null,
  suggested_offer text not null,
  fix_checklist jsonb not null default '[]',
  scan_results jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists unlocked_reports (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references audits(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  stripe_session_id text unique,
  customer_email text,
  amount_eur numeric(10,2) not null default 19,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unlocked_at timestamptz
);

create index if not exists search_runs_created_at_idx on search_runs(created_at desc);
create index if not exists leads_search_run_id_idx on leads(search_run_id);
create index if not exists leads_audit_slug_idx on leads(audit_slug);
create index if not exists audits_search_run_id_idx on audits(search_run_id);
create index if not exists audits_audit_slug_idx on audits(audit_slug);
create index if not exists unlocked_reports_audit_id_idx on unlocked_reports(audit_id);

alter table search_runs enable row level security;
alter table leads enable row level security;
alter table audits enable row level security;
alter table unlocked_reports enable row level security;

drop policy if exists "Public can read lead previews" on leads;
drop policy if exists "Public can read audit previews" on audits;

create policy "Public can read lead previews" on leads for select using (true);
create policy "Public can read audit previews" on audits for select using (true);
