create extension if not exists pgcrypto;

create table if not exists public.buyer_prospects (
  id uuid primary key default gen_random_uuid()
);

alter table public.buyer_prospects
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now(),
add column if not exists lead_id uuid,
add column if not exists business_name text,
add column if not exists website text,
add column if not exists website_url text,
add column if not exists email text,
add column if not exists email_normalized text,
add column if not exists contact_url text,
add column if not exists contact_page_url text,
add column if not exists phone text,
add column if not exists city text,
add column if not exists country text,
add column if not exists business_type text,
add column if not exists service_category text,
add column if not exists status text default 'new',
add column if not exists source text,
add column if not exists notes text,
add column if not exists payload jsonb default '{}'::jsonb,
add column if not exists metadata jsonb default '{}'::jsonb;

create table if not exists public.outreach_queue (
  id uuid primary key default gen_random_uuid()
);

alter table public.outreach_queue
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now(),
add column if not exists queued_at timestamptz default now(),
add column if not exists sent_at timestamptz,
add column if not exists completed_at timestamptz,
add column if not exists business_name text,
add column if not exists website text,
add column if not exists website_url text,
add column if not exists email text,
add column if not exists recipient_email text,
add column if not exists recipient_name text,
add column if not exists contact_url text,
add column if not exists reply_url text,
add column if not exists phone text,
add column if not exists subject text,
add column if not exists message text,
add column if not exists message_body text,
add column if not exists status text default 'pending',
add column if not exists error text,
add column if not exists error_message text,
add column if not exists paused boolean default false,
add column if not exists stopped boolean default false,
add column if not exists skipped boolean default false,
add column if not exists lead_id uuid,
add column if not exists audit_slug text,
add column if not exists source text,
add column if not exists notes text,
add column if not exists payload jsonb default '{}'::jsonb;

create index if not exists buyer_prospects_status_idx on public.buyer_prospects(status);
create index if not exists buyer_prospects_email_idx on public.buyer_prospects(email);
create index if not exists buyer_prospects_email_normalized_idx on public.buyer_prospects(email_normalized);
create unique index if not exists buyer_prospects_email_normalized_unique on public.buyer_prospects(email_normalized) where email_normalized is not null;

create index if not exists outreach_queue_status_idx on public.outreach_queue(status);
create index if not exists outreach_queue_queued_at_idx on public.outreach_queue(queued_at desc);
create index if not exists outreach_queue_recipient_email_idx on public.outreach_queue(recipient_email);

notify pgrst, 'reload schema';
