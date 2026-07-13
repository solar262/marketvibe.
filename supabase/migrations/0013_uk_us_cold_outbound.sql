alter table sales_leads
  add column if not exists lead_origin text not null default 'inbound_fit_check',
  add column if not exists source_url text,
  add column if not exists source_evidence text,
  add column if not exists recipient_type text not null default 'unknown',
  add column if not exists lawful_basis text not null default 'not_applicable',
  add column if not exists compliance_status text not null default 'not_checked',
  add column if not exists email_permission_status text not null default 'not_checked',
  add column if not exists cold_outbound_approved_at timestamptz,
  add column if not exists cold_outbound_approved_by text,
  add column if not exists outbound_sequence_status text not null default 'not_started';

alter table sales_leads
  drop constraint if exists sales_leads_lead_origin_check,
  add constraint sales_leads_lead_origin_check check (lead_origin in (
    'inbound_fit_check',
    'cold_outbound',
    'navigator_import',
    'manual_import'
  ));

alter table sales_leads
  drop constraint if exists sales_leads_recipient_type_check,
  add constraint sales_leads_recipient_type_check check (recipient_type in (
    'uk_corporate_subscriber',
    'us_b2b_contact',
    'eu_contact',
    'sole_trader',
    'personal_email',
    'unknown'
  ));

alter table sales_leads
  drop constraint if exists sales_leads_lawful_basis_check,
  add constraint sales_leads_lawful_basis_check check (lawful_basis in (
    'consent',
    'legitimate_interest',
    'can_spam_business_context',
    'manual_review',
    'not_applicable'
  ));

alter table sales_leads
  drop constraint if exists sales_leads_compliance_status_check,
  add constraint sales_leads_compliance_status_check check (compliance_status in (
    'not_checked',
    'approved',
    'manual_review',
    'blocked'
  ));

alter table sales_leads
  drop constraint if exists sales_leads_email_permission_status_check,
  add constraint sales_leads_email_permission_status_check check (email_permission_status in (
    'not_checked',
    'can_email',
    'manual_review',
    'do_not_email'
  ));

alter table sales_leads
  drop constraint if exists sales_leads_outbound_sequence_status_check,
  add constraint sales_leads_outbound_sequence_status_check check (outbound_sequence_status in (
    'not_started',
    'approved',
    'queued',
    'sending',
    'sent',
    'paused',
    'stopped'
  ));

alter table sales_email_events
  drop constraint if exists sales_email_events_sequence_type_check,
  add constraint sales_email_events_sequence_type_check check (sequence_type in (
    'new_qualified_lead',
    'proof_pack_onboarding',
    'proof_pack_delivery_followup',
    'proof_pack_to_subscription',
    'inactive_subscriber',
    'cold_outbound'
  ));

create index if not exists sales_leads_origin_idx on sales_leads(lead_origin, updated_at desc);
create index if not exists sales_leads_compliance_idx on sales_leads(compliance_status, email_permission_status, updated_at desc);
create index if not exists sales_leads_region_compliance_idx on sales_leads(region, compliance_status, fit, score desc);
create index if not exists sales_email_events_cold_daily_idx on sales_email_events(sequence_type, status, sent_at);
