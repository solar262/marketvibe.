create extension if not exists pgcrypto;

create table if not exists sales_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null unique,
  name text,
  company_name text,
  website text,
  customer_journey text not null check (customer_journey in ('proof_pack', 'subscriber')),
  service_offered text not null,
  average_client_value integer not null default 0,
  target_industry text not null,
  target_countries text not null,
  company_size text not null,
  weekly_outreach_capacity integer not null default 0,
  current_lead_generation_method text not null,
  score integer not null default 0 check (score >= 0 and score <= 100),
  fit text not null default 'low' check (fit in ('high', 'medium', 'low')),
  score_reasons jsonb not null default '[]'::jsonb,
  stage text not null default 'new_lead' check (stage in (
    'new_lead',
    'qualified',
    'contacted',
    'interested',
    'proof_pack_purchased',
    'proof_pack_delivered',
    'subscription_opportunity',
    'subscriber',
    'lost'
  )),
  owner text,
  source text not null default 'qualification_form',
  utm_source text,
  utm_campaign text,
  region text not null default 'OTHER' check (region in ('US', 'UK', 'EU', 'OTHER')),
  country text,
  consent_marketing boolean not null default false,
  consent_source text,
  consent_timestamp timestamptz,
  consent_ip text,
  unsubscribe_token_hash text,
  is_suppressed boolean not null default false,
  lost_reason text,
  next_task_at timestamptz,
  last_contacted_at timestamptz,
  last_activity_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references sales_leads(id) on delete cascade,
  body text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists sales_lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references sales_leads(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'todo' check (status in ('todo', 'done', 'skipped')),
  assigned_to text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists sales_lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references sales_leads(id) on delete cascade,
  from_stage text,
  to_stage text not null check (to_stage in (
    'new_lead',
    'qualified',
    'contacted',
    'interested',
    'proof_pack_purchased',
    'proof_pack_delivered',
    'subscription_opportunity',
    'subscriber',
    'lost'
  )),
  changed_by text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists sales_email_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references sales_leads(id) on delete set null,
  email text not null,
  normalized_email text not null,
  sequence_type text not null check (sequence_type in (
    'new_qualified_lead',
    'proof_pack_onboarding',
    'proof_pack_delivery_followup',
    'proof_pack_to_subscription',
    'inactive_subscriber'
  )),
  subject text not null,
  html_content text not null,
  text_content text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'skipped', 'failed')),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  failure_reason text,
  created_at timestamptz not null default now()
);

create table if not exists sales_suppression_list (
  id uuid primary key default gen_random_uuid(),
  normalized_email text not null unique,
  reason text not null default 'unsubscribed',
  region text not null default 'OTHER' check (region in ('US', 'UK', 'EU', 'OTHER')),
  source text,
  created_at timestamptz not null default now()
);

create index if not exists sales_leads_stage_idx on sales_leads(stage, updated_at desc);
create index if not exists sales_leads_fit_idx on sales_leads(fit, score desc);
create index if not exists sales_leads_journey_idx on sales_leads(customer_journey, created_at desc);
create index if not exists sales_leads_search_idx on sales_leads using gin (
  to_tsvector('english', coalesce(email, '') || ' ' || coalesce(name, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(service_offered, '') || ' ' || coalesce(target_industry, ''))
);
create index if not exists sales_lead_notes_lead_idx on sales_lead_notes(lead_id, created_at desc);
create index if not exists sales_lead_tasks_lead_status_idx on sales_lead_tasks(lead_id, status, due_at);
create index if not exists sales_lead_status_history_lead_idx on sales_lead_status_history(lead_id, created_at desc);
create index if not exists sales_email_events_due_idx on sales_email_events(status, scheduled_at);
create index if not exists sales_email_events_lead_idx on sales_email_events(lead_id, created_at desc);

alter table sales_leads enable row level security;
alter table sales_lead_notes enable row level security;
alter table sales_lead_tasks enable row level security;
alter table sales_lead_status_history enable row level security;
alter table sales_email_events enable row level security;
alter table sales_suppression_list enable row level security;
