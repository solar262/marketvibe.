create extension if not exists pgcrypto;

create table if not exists sample_requests (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text,
  niche text,
  product_code text not null default 'proof_pack' check (product_code = 'proof_pack'),
  amount_total integer not null default 0,
  currency text not null default 'eur',
  status text not null default 'paid' check (status in ('paid', 'pdf_sent', 'email_failed')),
  stripe_session_id text unique,
  stripe_customer_id text,
  paid_at timestamptz,
  pdf_generated_at timestamptz,
  pdf_sent_at timestamptz,
  sendgrid_message_id text,
  error_summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_vault (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  website text,
  source_url text,
  niche text,
  intent_score integer not null default 0,
  evidence_summary text,
  public_signal_text text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists radar_email_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  lead_count integer not null default 0,
  recipient_email text,
  template_id text,
  provider_message_id text,
  query_sql text not null default $$SELECT * FROM lead_vault WHERE created_at >= now() - interval '24 hours' AND intent_score >= 85 ORDER BY intent_score DESC LIMIT 30$$,
  error_summary jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sample_requests_status_idx on sample_requests(status, created_at);
create index if not exists sample_requests_customer_email_idx on sample_requests(customer_email);
create index if not exists sample_requests_stripe_session_idx on sample_requests(stripe_session_id);
create index if not exists lead_vault_daily_radar_idx on lead_vault(created_at desc, intent_score desc);
create index if not exists lead_vault_niche_score_idx on lead_vault(niche, intent_score desc);
create index if not exists radar_email_runs_created_idx on radar_email_runs(created_at desc);

alter table sample_requests enable row level security;
alter table lead_vault enable row level security;
alter table radar_email_runs enable row level security;
