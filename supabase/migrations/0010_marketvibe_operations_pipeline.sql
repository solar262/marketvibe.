create extension if not exists pgcrypto;

alter table premium_import_batches add column if not exists source_format text not null default 'csv' check (source_format in ('csv', 'xlsx', 'quick_paste'));
alter table premium_import_batches add column if not exists file_checksum text;
alter table premium_import_batches add column if not exists worksheet_name text;
alter table premium_import_batches add column if not exists row_fingerprints jsonb not null default '[]'::jsonb;
alter table premium_import_batches add column if not exists import_summary jsonb not null default '{}'::jsonb;

create table if not exists marketvibe_provider_configurations (
  id uuid primary key default gen_random_uuid(),
  provider_identifier text not null unique,
  provider_name text not null,
  provider_type text not null check (provider_type in ('buyer_stock', 'opportunity_discovery', 'website_verification', 'decision_maker_resolution', 'email', 'billing', 'scheduler', 'storage', 'content')),
  enabled boolean not null default false,
  credential_state text not null default 'not_configured' check (credential_state in ('not_required', 'not_configured', 'configured', 'invalid')),
  supported_countries text[] not null default '{}',
  supported_sectors text[] not null default '{}',
  rate_limit_state jsonb not null default '{}'::jsonb,
  last_successful_run timestamptz,
  last_attempted_run timestamptz,
  next_scheduled_run timestamptz,
  discovered_count integer not null default 0,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  failure_count integer not null default 0,
  health_status text not null default 'Blocked' check (health_status in ('Operational', 'Degraded', 'Blocked')),
  health_message text not null default 'Provider has not been configured.',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketvibe_provider_runs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references marketvibe_provider_configurations(id) on delete set null,
  provider_identifier text not null,
  run_type text not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'partial', 'skipped')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_attempted integer not null default 0,
  records_succeeded integer not null default 0,
  records_failed integer not null default 0,
  retry_count integer not null default 0,
  error_summary jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  job_run_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_buyer_companies (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  source_imported_prospect_id uuid references premium_imported_prospects(id) on delete set null,
  source_import_batch_id uuid references premium_import_batches(id) on delete set null,
  original_filename text,
  file_checksum text,
  row_fingerprint text,
  company_name text not null,
  trading_name text,
  website text,
  canonical_domain text,
  country text,
  state_region text,
  city text,
  operating_locations text[] not null default '{}',
  company_description text,
  sector text,
  service_specialisms text[] not null default '{}',
  employee_range_estimate text,
  revenue_band_estimate text,
  company_profile_urls text[] not null default '{}',
  public_evidence_urls text[] not null default '{}',
  public_evidence_summary text,
  source_provider text not null default 'uploaded_file',
  source_date timestamptz not null default now(),
  last_verified_date timestamptz,
  website_status text not null default 'queued' check (website_status in ('queued', 'verified', 'failed', 'skipped', 'blocked')),
  buyer_status text not null default 'website_verification_queued' check (buyer_status in ('discovered', 'structurally_validated', 'deduplicated', 'website_verification_queued', 'website_verified', 'enriched', 'scored', 'qualified', 'active', 'stale', 'refresh_queued', 'refreshed', 'rejected', 'quarantined', 'archived', 'contact_unresolved', 'retry_scheduled')),
  contact_status text not null default 'unresolved' check (contact_status in ('unresolved', 'resolved', 'suppressed', 'not_required')),
  likely_buyer_type text,
  sector_fit_score integer not null default 0,
  geography_fit_score integer not null default 0,
  capacity_score integer not null default 0,
  commercial_fit_score integer not null default 0,
  freshness_score integer not null default 0,
  overall_buyer_score integer not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  qualification_reason text,
  rejection_reason text,
  is_test_data boolean not null default false,
  environment_scope text not null default 'production' check (environment_scope in ('development', 'test', 'staging', 'production')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists marketvibe_company_evidence (
  id uuid primary key default gen_random_uuid(),
  buyer_company_id uuid references marketvibe_buyer_companies(id) on delete cascade,
  evidence_type text not null,
  source_url text,
  evidence_summary text not null,
  evidence_excerpt text,
  evidence_checksum text,
  content_checksum text,
  captured_at timestamptz not null default now(),
  verified_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists marketvibe_buyer_contacts (
  id uuid primary key default gen_random_uuid(),
  buyer_company_id uuid references marketvibe_buyer_companies(id) on delete cascade,
  person_name text not null,
  role text,
  source text not null,
  source_url text,
  provider_reference text,
  verification_date timestamptz,
  business_email text,
  business_email_status text not null default 'unknown' check (business_email_status in ('unknown', 'verified', 'invalid', 'not_available')),
  phone text,
  phone_status text not null default 'unknown' check (phone_status in ('unknown', 'verified', 'invalid', 'not_available')),
  linkedin_url text,
  confidence integer not null default 0,
  suppression_state text not null default 'clear' check (suppression_state in ('clear', 'suppressed')),
  lawful_use_classification text not null default 'business_context',
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_contact_provenance (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references marketvibe_buyer_contacts(id) on delete cascade,
  field_name text not null,
  source text not null,
  source_url text,
  provider_reference text,
  captured_at timestamptz not null default now()
);

create table if not exists marketvibe_opportunity_evidence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities(id) on delete cascade,
  canonical_source_url text,
  source_provider text,
  source_category text,
  source_publication_date timestamptz,
  discovery_date timestamptz not null default now(),
  source_organisation text,
  evidence_excerpt text,
  evidence_summary text not null,
  evidence_checksum text,
  compliance_classification text not null default 'public_business_source',
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists marketvibe_score_breakdowns (
  id uuid primary key default gen_random_uuid(),
  record_type text not null check (record_type in ('buyer_company', 'opportunity', 'match')),
  record_id uuid not null,
  scoring_version text not null,
  total_score integer not null,
  threshold_used integer not null,
  final_classification text not null,
  components jsonb not null default '{}'::jsonb,
  scored_at timestamptz not null default now()
);

create table if not exists marketvibe_customer_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  company text,
  billing_email text not null,
  contact_email text,
  target_countries text[] not null default '{}',
  target_regions text[] not null default '{}',
  target_sectors text[] not null default '{}',
  target_services text[] not null default '{}',
  minimum_opportunity_score integer not null default 55,
  minimum_confidence integer not null default 50,
  minimum_commercial_value_band text,
  excluded_competitors text[] not null default '{}',
  exclusivity_preference text not null default 'customer_exclusive',
  delivery_frequency text not null default 'weekly',
  delivery_quantity integer not null default 10,
  delivery_channel text not null default 'dashboard',
  product_entitlement text,
  active boolean not null default true,
  compliance_preferences jsonb not null default '{}'::jsonb,
  suppression_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketvibe_matches (
  id uuid primary key default gen_random_uuid(),
  buyer_company_id uuid references marketvibe_buyer_companies(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  customer_profile_id uuid references marketvibe_customer_profiles(id) on delete set null,
  total_match_score integer not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  match_explanation text not null,
  risk_flags text[] not null default '{}',
  exclusivity_state text not null default 'none',
  reservation_state text not null default 'available',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists marketvibe_reservations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references marketvibe_matches(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  customer_profile_id uuid references marketvibe_customer_profiles(id) on delete set null,
  exclusivity_key text not null,
  status text not null default 'active' check (status in ('active', 'released', 'expired')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_proof_packs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references marketvibe_matches(id) on delete set null,
  opportunity_id uuid references opportunities(id) on delete set null,
  html_content text not null,
  source_provenance jsonb not null default '{}'::jsonb,
  proof_pack_version text not null default '1',
  delivery_identifier text unique,
  status text not null default 'ready' check (status in ('draft', 'ready', 'delivered', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_deliveries (
  id uuid primary key default gen_random_uuid(),
  proof_pack_id uuid references marketvibe_proof_packs(id) on delete set null,
  customer_profile_id uuid references marketvibe_customer_profiles(id) on delete set null,
  delivery_channel text not null,
  recipient text not null,
  provider_message_identifier text,
  delivery_status text not null default 'queued' check (delivery_status in ('queued', 'sent', 'delivered', 'failed', 'retry_scheduled', 'suppressed')),
  retry_count integer not null default 0,
  failure_reason text,
  replacement_eligibility boolean not null default true,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  buyer_company_id uuid references marketvibe_buyer_companies(id) on delete set null,
  contact_id uuid references marketvibe_buyer_contacts(id) on delete set null,
  match_id uuid references marketvibe_matches(id) on delete set null,
  recipient text,
  subject text,
  body text not null,
  personalisation_provenance jsonb not null default '{}'::jsonb,
  compliance_status text not null default 'drafted',
  outreach_status text not null default 'drafted' check (outreach_status in ('drafted', 'compliance_checked', 'queued', 'sent', 'delivered', 'replied', 'interested', 'meeting_requested', 'closed', 'deferred', 'unsubscribed', 'bounced', 'failed', 'suppressed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketvibe_outreach_events (
  id uuid primary key default gen_random_uuid(),
  outreach_draft_id uuid references marketvibe_outreach_drafts(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_replies (
  id uuid primary key default gen_random_uuid(),
  outreach_draft_id uuid references marketvibe_outreach_drafts(id) on delete set null,
  sender text not null,
  body text not null,
  classification text not null default 'unclassified',
  received_at timestamptz not null default now()
);

create table if not exists marketvibe_suppression_records (
  id uuid primary key default gen_random_uuid(),
  suppression_key text not null unique,
  suppression_type text not null check (suppression_type in ('unsubscribe', 'hard_bounce', 'soft_bounce_repeat', 'complaint', 'owner', 'customer', 'domain')),
  reason text not null,
  source text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_job_definitions (
  job_name text primary key,
  enabled boolean not null default true,
  cadence text not null,
  next_scheduled timestamptz,
  health_status text not null default 'Blocked' check (health_status in ('Operational', 'Degraded', 'Blocked')),
  current_backlog integer not null default 0,
  most_recent_error_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketvibe_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text references marketvibe_job_definitions(job_name) on delete set null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'partial', 'skipped')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_successful timestamptz,
  records_attempted integer not null default 0,
  records_succeeded integer not null default 0,
  records_failed integer not null default 0,
  retry_count integer not null default 0,
  idempotency_key text unique,
  error_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_job_queue (
  id uuid primary key default gen_random_uuid(),
  job_name text references marketvibe_job_definitions(job_name) on delete set null,
  related_record_type text not null,
  related_record_id uuid not null,
  queue_status text not null default 'queued' check (queue_status in ('queued', 'running', 'completed', 'failed', 'retry_scheduled', 'permanent_failure')),
  run_after timestamptz not null default now(),
  retry_count integer not null default 0,
  last_error text,
  locked_by text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_name, related_record_type, related_record_id)
);

create table if not exists marketvibe_job_locks (
  job_name text primary key,
  locked_by text not null,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists marketvibe_exceptions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  explanation text not null,
  affected_record_type text,
  affected_record_id uuid,
  supporting_evidence jsonb not null default '{}'::jsonb,
  recommended_action text not null,
  commercial_impact text,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'approved', 'rejected', 'deferred', 'resolved')),
  resolution_audit_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketvibe_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('system', 'admin', 'owner', 'customer', 'provider')),
  related_record_type text,
  related_record_id uuid,
  source_state text,
  destination_state text,
  reason text not null,
  job_run_id uuid references marketvibe_job_runs(id) on delete set null,
  retry_count integer not null default 0,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_content_queue (
  id uuid primary key default gen_random_uuid(),
  theme text not null,
  hook text not null,
  body text not null,
  call_to_action text not null,
  source_references text[] not null default '{}',
  creation_date date not null default current_date,
  recommended_publication_date date,
  status text not null default 'draft' check (status in ('draft', 'ready', 'copied', 'published', 'archived')),
  official_platform_publishing_status text not null default 'not_configured',
  created_at timestamptz not null default now()
);

create table if not exists marketvibe_system_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  health_status text not null check (health_status in ('Operational', 'Degraded', 'Blocked')),
  health_message text not null,
  metrics jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create unique index if not exists marketvibe_reservations_active_unique_idx
  on marketvibe_reservations(exclusivity_key)
  where status = 'active';
create index if not exists marketvibe_buyer_companies_status_idx on marketvibe_buyer_companies(buyer_status, contact_status);
create index if not exists marketvibe_buyer_companies_domain_idx on marketvibe_buyer_companies(canonical_domain);
create index if not exists marketvibe_buyer_companies_score_idx on marketvibe_buyer_companies(overall_buyer_score desc);
create index if not exists marketvibe_company_evidence_company_idx on marketvibe_company_evidence(buyer_company_id, captured_at desc);
create index if not exists marketvibe_score_breakdowns_record_idx on marketvibe_score_breakdowns(record_type, record_id, scored_at desc);
create index if not exists marketvibe_matches_score_idx on marketvibe_matches(total_match_score desc, created_at desc);
create index if not exists marketvibe_deliveries_status_idx on marketvibe_deliveries(delivery_status, created_at desc);
create index if not exists marketvibe_outreach_drafts_status_idx on marketvibe_outreach_drafts(outreach_status, created_at desc);
create index if not exists marketvibe_job_queue_status_idx on marketvibe_job_queue(queue_status, run_after);
create index if not exists marketvibe_exceptions_status_idx on marketvibe_exceptions(status, severity, created_at desc);
create index if not exists marketvibe_audit_events_record_idx on marketvibe_audit_events(related_record_type, related_record_id, created_at desc);
create index if not exists marketvibe_system_health_snapshots_service_idx on marketvibe_system_health_snapshots(service_name, captured_at desc);

insert into marketvibe_job_definitions (job_name, cadence, health_status, most_recent_error_summary)
values
  ('buyer_validation', 'after import', 'Operational', '{}'::jsonb),
  ('website_verification', 'every 15 minutes', 'Operational', '{}'::jsonb),
  ('buyer_scoring', 'every 15 minutes', 'Operational', '{}'::jsonb),
  ('opportunity_discovery', 'daily cron', 'Blocked', '{"reason":"Provider configuration required"}'::jsonb),
  ('opportunity_matching', 'daily cron', 'Blocked', '{"reason":"Customer profiles required"}'::jsonb),
  ('proof_pack_generation', 'after matching', 'Blocked', '{"reason":"Qualified matches required"}'::jsonb),
  ('outreach_preparation', 'after proof pack', 'Blocked', '{"reason":"Email activation not complete"}'::jsonb),
  ('daily_owner_digest', 'daily cron', 'Blocked', '{"reason":"Owner notification channel required"}'::jsonb)
on conflict (job_name) do nothing;

insert into marketvibe_provider_configurations (provider_identifier, provider_name, provider_type, enabled, credential_state, health_status, health_message)
values
  ('uploaded_files', 'Uploaded XLSX and CSV files', 'buyer_stock', true, 'not_required', 'Operational', 'Owner-uploaded files are enabled.'),
  ('pasted_public_urls', 'Pasted public URLs', 'buyer_stock', true, 'not_required', 'Operational', 'Pasted source references are enabled.'),
  ('company_websites', 'Company websites', 'website_verification', true, 'not_required', 'Operational', 'Safe server-side website verification is available.'),
  ('email_provider', 'Transactional email provider', 'email', false, 'not_configured', 'Blocked', 'Configure sender domain, reply-to, unsubscribe secret, and webhook verification.'),
  ('stripe', 'Stripe billing', 'billing', false, 'not_configured', 'Blocked', 'Configure Stripe secret and product identifiers.'),
  ('vercel_cron', 'Vercel Cron scheduler', 'scheduler', true, 'not_required', 'Degraded', 'Cron routes exist; production schedule and secret must be verified.')
on conflict (provider_identifier) do nothing;

insert into marketvibe_buyer_companies (
  identity_key,
  source_imported_prospect_id,
  source_import_batch_id,
  original_filename,
  company_name,
  website,
  canonical_domain,
  country,
  city,
  sector,
  employee_range_estimate,
  public_evidence_urls,
  public_evidence_summary,
  source_provider,
  contact_status,
  buyer_status,
  website_status,
  is_test_data,
  environment_scope,
  qualification_reason
)
select
  case
    when coalesce(p.company_domain, '') <> '' then 'domain:' || lower(p.company_domain)
    when coalesce(p.company_website, '') <> '' then 'website:' || lower(regexp_replace(p.company_website, '^https?://(www\.)?', ''))
    when coalesce(p.company_linkedin_url, '') <> '' then 'company_linkedin:' || lower(p.company_linkedin_url)
    else 'name_country:' || lower(regexp_replace(p.company_name, '\s+', ' ', 'g')) || ':' || lower(coalesce(p.country, ''))
  end,
  p.id,
  p.batch_id,
  b.original_filename,
  p.company_name,
  p.company_website,
  p.company_domain,
  p.country,
  p.city,
  p.industry,
  p.company_size,
  array_remove(array[p.company_website, p.public_signal_url, p.company_linkedin_url, p.linkedin_profile_url], null),
  coalesce(nullif(p.public_signal_text, ''), 'Company imported from an existing structurally valid source row.'),
  'existing_import_backfill',
  'unresolved',
  case when coalesce(p.company_website, p.company_domain, '') <> '' then 'website_verification_queued' else 'contact_unresolved' end,
  case when coalesce(p.company_website, p.company_domain, '') <> '' then 'queued' else 'skipped' end,
  p.is_test_data,
  case when p.is_test_data then 'test' else 'production' end,
  'Existing structurally valid imported company entered the buyer pipeline.'
from premium_imported_prospects p
left join premium_import_batches b on b.id = p.batch_id
where coalesce(p.company_name, '') <> ''
on conflict (identity_key) do nothing;

alter table marketvibe_provider_configurations enable row level security;
alter table marketvibe_provider_runs enable row level security;
alter table marketvibe_buyer_companies enable row level security;
alter table marketvibe_company_evidence enable row level security;
alter table marketvibe_buyer_contacts enable row level security;
alter table marketvibe_contact_provenance enable row level security;
alter table marketvibe_opportunity_evidence enable row level security;
alter table marketvibe_score_breakdowns enable row level security;
alter table marketvibe_customer_profiles enable row level security;
alter table marketvibe_matches enable row level security;
alter table marketvibe_reservations enable row level security;
alter table marketvibe_proof_packs enable row level security;
alter table marketvibe_deliveries enable row level security;
alter table marketvibe_outreach_drafts enable row level security;
alter table marketvibe_outreach_events enable row level security;
alter table marketvibe_replies enable row level security;
alter table marketvibe_suppression_records enable row level security;
alter table marketvibe_job_definitions enable row level security;
alter table marketvibe_job_runs enable row level security;
alter table marketvibe_job_queue enable row level security;
alter table marketvibe_job_locks enable row level security;
alter table marketvibe_exceptions enable row level security;
alter table marketvibe_audit_events enable row level security;
alter table marketvibe_content_queue enable row level security;
alter table marketvibe_system_health_snapshots enable row level security;
