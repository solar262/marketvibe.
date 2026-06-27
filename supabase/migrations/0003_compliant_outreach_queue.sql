create extension if not exists "uuid-ossp";

create table if not exists buyer_prospects (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  email text not null,
  email_normalized text unique not null,
  business_name text,
  website text,
  contact_page_url text,
  source text not null default 'saved_lead',
  lawful_basis text not null default 'public_business_contact',
  status text not null default 'active' check (status in ('active', 'suppressed', 'invalid')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outreach_suppression (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  email_normalized text unique not null,
  reason text not null default 'unsubscribe',
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists outreach_queue (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid references buyer_prospects(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  audit_id uuid references audits(id) on delete set null,
  recipient_email text not null,
  recipient_email_normalized text not null,
  recipient_name text,
  subject text not null,
  body_text text not null,
  provider text,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped', 'cancelled')),
  error_message text,
  provider_message_id text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  last_attempt_at timestamptz,
  metadata jsonb not null default '{}'
);

create table if not exists outreach_events (
  id uuid primary key default uuid_generate_v4(),
  queue_id uuid references outreach_queue(id) on delete set null,
  prospect_id uuid references buyer_prospects(id) on delete set null,
  recipient_email_normalized text,
  event_type text not null,
  provider text,
  provider_event_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists buyer_prospects_email_normalized_idx on buyer_prospects(email_normalized);
create index if not exists outreach_suppression_email_normalized_idx on outreach_suppression(email_normalized);
create index if not exists outreach_queue_status_queued_at_idx on outreach_queue(status, queued_at);
create index if not exists outreach_queue_recipient_idx on outreach_queue(recipient_email_normalized);
create index if not exists outreach_events_recipient_idx on outreach_events(recipient_email_normalized);

alter table buyer_prospects enable row level security;
alter table outreach_suppression enable row level security;
alter table outreach_queue enable row level security;
alter table outreach_events enable row level security;
