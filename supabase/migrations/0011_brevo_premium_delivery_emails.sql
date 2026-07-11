-- Track the product-specific Brevo delivery email separately from the legacy
-- opportunity batch email timestamp. This keeps Proof Pack PDF and Radar
-- delivery idempotency explicit without changing historical batch records.

alter table if exists opportunity_delivery_batches
  add column if not exists premium_email_sent_at timestamptz;

alter table if exists opportunity_delivery_batches
  add column if not exists delivery_email_provider text;

create index if not exists opportunity_delivery_batches_premium_email_pending_idx
  on opportunity_delivery_batches (created_at)
  where premium_email_sent_at is null
    and status in ('published', 'delivered');
