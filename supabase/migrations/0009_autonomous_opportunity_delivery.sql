create extension if not exists pgcrypto;

-- Autonomous opportunity delivery lifecycle. This migration is additive:
-- it creates new tables/indexes and only adds a test-data flag to imported
-- prospects so rejected importer test rows cannot enter matching workflows.

create table if not exists opportunity_automation_settings (
  id text primary key default 'default',
  automation_paused boolean not null default false,
  paused_reason text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunity_automation_settings_singleton check (id = 'default')
);

insert into opportunity_automation_settings (id)
values ('default')
on conflict (id) do nothing;

create table if not exists customer_search_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  product_code text not null check (product_code in ('proof_pack', 'radar', 'growth_desk')),
  status text not null default 'active' check (status in ('active', 'paused')),
  niche text not null,
  target_service text not null,
  target_industries text[] not null default '{}',
  target_locations text[] not null default '{}',
  company_sizes text[] not null default '{}',
  target_job_roles text[] not null default '{}',
  minimum_fit_score integer not null default 50,
  minimum_intent_score integer not null default 40,
  minimum_evidence_score integer not null default 50,
  maximum_record_age_days integer not null default 90,
  opportunity_quantity integer not null default 10,
  delivery_frequency text not null default 'weekly' check (delivery_frequency in ('once', 'daily', 'weekly', 'monthly')),
  exclusivity_mode text not null default 'customer_exclusive' check (exclusivity_mode in ('non_exclusive', 'customer_exclusive', 'niche_exclusive', 'geographic_exclusive', 'time_limited_exclusive')),
  exclusivity_period_days integer not null default 14,
  allow_profile_only boolean not null default false,
  replacement_policy text not null default 'objective_failures' check (replacement_policy in ('none', 'objective_failures', 'admin_review', 'automatic')),
  onboarding_id uuid references premium_onboarding(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_email, product_code, niche)
);

create table if not exists opportunity_source_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('discovery', 'verification', 'matching', 'delivery', 'refresh', 'replacement', 'health')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'partial', 'skipped')),
  trigger_source text not null default 'admin',
  idempotency_key text unique,
  source_name text,
  source_type text,
  search_profile_id uuid references customer_search_profiles(id) on delete set null,
  customer_email text,
  niche text,
  target_location text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_discovered integer not null default 0,
  records_rejected integer not null default 0,
  records_qualified integer not null default 0,
  records_added_to_inventory integer not null default 0,
  duplicate_count integer not null default 0,
  stale_records integer not null default 0,
  customer_shortages integer not null default 0,
  source_failures jsonb not null default '[]'::jsonb,
  error_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists opportunity_source_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references opportunity_source_runs(id) on delete cascade,
  source_name text not null,
  source_type text not null,
  source_url text,
  error_message text not null,
  retry_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  company_domain text,
  company_website text,
  company_linkedin_url text,
  company_location text,
  company_country text,
  company_industry text,
  company_size text,
  company_description text,
  contact_first_name text,
  contact_last_name text,
  contact_full_name text,
  contact_job_title text,
  contact_linkedin_url text,
  public_email text,
  public_phone text,
  source_type text not null,
  source_name text not null,
  source_url text not null,
  source_title text,
  source_text text not null,
  source_published_at timestamptz,
  captured_at timestamptz not null default now(),
  last_verified_at timestamptz,
  next_verification_at timestamptz,
  fit_score integer not null default 0,
  intent_score integer not null default 0,
  evidence_score integer not null default 0,
  freshness_score integer not null default 0,
  overall_score integer not null default 0,
  score_reasons jsonb not null default '{}'::jsonb,
  intent_category text not null default 'unavailable' check (intent_category in ('verified_direct_intent', 'public_opportunity_signal', 'weak_research_signal', 'company_fit', 'profile_only', 'unavailable')),
  evidence_status text not null default 'unavailable' check (evidence_status in ('unavailable', 'profile_only', 'website_verified', 'public_signal_verified', 'decision_maker_verified')),
  verification_status text not null default 'DISCOVERED' check (verification_status in ('DISCOVERED', 'VALIDATING', 'REJECTED', 'QUALIFIED', 'EXPIRED')),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  inventory_status text not null default 'DISCOVERED' check (inventory_status in ('DISCOVERED', 'VALIDATING', 'REJECTED', 'QUALIFIED', 'IN_INVENTORY', 'RESERVED', 'ASSIGNED', 'PUBLISHED', 'DELIVERED', 'REPLACEMENT_REQUESTED', 'REPLACED', 'EXPIRED')),
  assignment_status text not null default 'unassigned' check (assignment_status in ('unassigned', 'reserved', 'assigned', 'published', 'delivered', 'removed')),
  delivery_status text not null default 'not_delivered' check (delivery_status in ('not_delivered', 'queued', 'published', 'delivered', 'email_failed')),
  replacement_status text not null default 'none' check (replacement_status in ('none', 'requested', 'approved', 'rejected', 'replaced')),
  customer_id uuid,
  customer_email text,
  product_code text check (product_code in ('proof_pack', 'radar', 'growth_desk')),
  niche text,
  target_location text,
  dedupe_key text not null,
  exclusivity_key text,
  rejection_reason text,
  internal_notes text,
  customer_summary text,
  recommended_action text,
  is_test_data boolean not null default false,
  raw_payload jsonb not null default '{}'::jsonb,
  quality_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists opportunity_delivery_batches (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  product_code text not null check (product_code in ('proof_pack', 'radar', 'growth_desk')),
  search_profile_id uuid references customer_search_profiles(id) on delete set null,
  opportunity_count integer not null default 0,
  status text not null default 'created' check (status in ('created', 'published', 'email_failed', 'delivered', 'failed')),
  access_token_hash text,
  idempotency_key text unique,
  csv_generated_at timestamptz,
  email_sent_at timestamptz,
  error_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists opportunity_assignments (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  search_profile_id uuid references customer_search_profiles(id) on delete set null,
  customer_email text not null,
  product_code text not null check (product_code in ('proof_pack', 'radar', 'growth_desk')),
  assignment_status text not null default 'reserved' check (assignment_status in ('reserved', 'assigned', 'published', 'delivered', 'removed', 'replaced')),
  delivery_status text not null default 'not_delivered' check (delivery_status in ('not_delivered', 'queued', 'published', 'delivered', 'email_failed')),
  delivery_batch_id uuid references opportunity_delivery_batches(id) on delete set null,
  match_reason jsonb not null default '{}'::jsonb,
  replacement_for_assignment_id uuid references opportunity_assignments(id) on delete set null,
  reserved_at timestamptz,
  assigned_at timestamptz,
  published_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, customer_email, product_code)
);

create table if not exists opportunity_exclusivity_reservations (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  search_profile_id uuid references customer_search_profiles(id) on delete set null,
  customer_email text not null,
  product_code text not null check (product_code in ('proof_pack', 'radar', 'growth_desk')),
  exclusivity_key text not null,
  exclusivity_mode text not null check (exclusivity_mode in ('non_exclusive', 'customer_exclusive', 'niche_exclusive', 'geographic_exclusive', 'time_limited_exclusive')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'active' check (status in ('active', 'released', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists opportunity_verification_events (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  verification_status text not null,
  website_status text,
  source_status text,
  evidence_found boolean not null default false,
  notes text,
  raw_result jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists opportunity_replacement_requests (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references opportunity_assignments(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  customer_email text not null,
  reason text not null check (reason in ('website_dead', 'company_closed', 'person_no_longer_in_role', 'contact_invalid', 'duplicate', 'outside_criteria', 'evidence_unavailable', 'other')),
  details text,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'fulfilled')),
  requested_by text not null default 'customer' check (requested_by in ('customer', 'admin', 'system')),
  reviewed_by text,
  review_note text,
  replacement_assignment_id uuid references opportunity_assignments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists opportunities_dedupe_key_idx on opportunities(dedupe_key);
create unique index if not exists opportunities_source_url_unique_idx on opportunities(source_url) where source_url is not null and source_url <> '';
create index if not exists opportunities_company_domain_idx on opportunities(company_domain);
create index if not exists opportunities_company_name_idx on opportunities(company_name);
create index if not exists opportunities_public_email_idx on opportunities(public_email) where public_email is not null;
create index if not exists opportunities_public_phone_idx on opportunities(public_phone) where public_phone is not null;
create index if not exists opportunities_status_idx on opportunities(inventory_status, verification_status, review_status);
create index if not exists opportunities_scores_idx on opportunities(overall_score desc, intent_score desc, evidence_score desc);
create index if not exists opportunities_next_verification_idx on opportunities(next_verification_at);
create index if not exists opportunities_customer_idx on opportunities(customer_email, product_code);
create index if not exists opportunities_niche_location_idx on opportunities(niche, target_location);
create index if not exists opportunity_source_runs_started_idx on opportunity_source_runs(started_at desc);
create index if not exists customer_search_profiles_customer_idx on customer_search_profiles(customer_email, status);
create index if not exists opportunity_assignments_customer_idx on opportunity_assignments(customer_email, product_code, assignment_status);
create index if not exists opportunity_assignments_delivery_batch_idx on opportunity_assignments(delivery_batch_id);
create index if not exists opportunity_replacements_customer_idx on opportunity_replacement_requests(customer_email, status);
create index if not exists opportunity_verification_events_opportunity_idx on opportunity_verification_events(opportunity_id, checked_at desc);
create index if not exists opportunity_exclusivity_active_idx on opportunity_exclusivity_reservations(exclusivity_key, status, ends_at);
create unique index if not exists opportunity_exclusivity_active_unique_idx
  on opportunity_exclusivity_reservations(exclusivity_key)
  where status = 'active';

alter table opportunity_automation_settings enable row level security;
alter table customer_search_profiles enable row level security;
alter table opportunity_source_runs enable row level security;
alter table opportunity_source_errors enable row level security;
alter table opportunities enable row level security;
alter table opportunity_delivery_batches enable row level security;
alter table opportunity_assignments enable row level security;
alter table opportunity_exclusivity_reservations enable row level security;
alter table opportunity_verification_events enable row level security;
alter table opportunity_replacement_requests enable row level security;

alter table premium_imported_prospects add column if not exists is_test_data boolean not null default false;
alter table premium_imported_prospects add column if not exists inventory_status text not null default 'imported';

update premium_imported_prospects
set is_test_data = true,
    inventory_status = 'rejected',
    updated_at = now()
where review_status = 'rejected'
  and (
    lower(company_name) in ('northstar test systems', 'lumen field test labs')
    or coalesce(public_email, '') ilike '%.test'
    or coalesce(company_domain, '') in ('example.com', 'example.org', 'example.test')
  );
