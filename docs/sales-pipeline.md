# MarketVibe sales pipeline

## What it adds

- Public qualification journey: `/qualify`
- Admin CRM pipeline: `/admin/sales-pipeline`
- Public lead API: `/api/sales/lead`
- Unsubscribe route: `/api/sales/unsubscribe`
- Protected email cron: `/api/cron/sales-pipeline`
- CSV export: `/api/admin/sales-pipeline/export`

## Database setup

Apply the migration:

```sql
supabase/migrations/0012_sales_pipeline.sql
```

It creates:

- `sales_leads`
- `sales_lead_notes`
- `sales_lead_tasks`
- `sales_lead_status_history`
- `sales_email_events`
- `sales_suppression_list`

The new tables are additive and do not change checkout, Proof Pack delivery, inventory, opportunity engine, Sales Navigator import, or existing customer access tables.

## Required environment

The pipeline reuses existing server configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_MARKETVIBE_LIST_ID`
- `CRON_SECRET`

Recommended:

- `SALES_PIPELINE_UNSUBSCRIBE_SECRET`

If `SALES_PIPELINE_UNSUBSCRIBE_SECRET` is not set, unsubscribe tokens fall back to `ADMIN_SESSION_SECRET`, then `CRON_SECRET`.

## Customer journeys

The `/qualify` form supports:

- EUR 99 one-time Proof Pack buyer
- Recurring MarketVibe subscriber

It collects service offered, average client value, target industry, target countries, company size, weekly outreach capacity, current lead-generation method, region, country, and marketing consent.

Scores:

- High fit: 80-100
- Medium fit: 60-79
- Low fit: below 60

High and medium fit leads start in `qualified`. Low fit leads start in `new_lead`.

## Admin workflow

Use `/admin/sales-pipeline` to:

- Filter by stage, fit, and journey
- Search by email, company, service, or industry
- Change stage
- Assign owner
- Record lost reason
- Add notes
- Add tasks
- View status history
- View queued/sent/skipped/failed sales email events
- Export CSV

Stages:

- New lead
- Qualified
- Contacted
- Interested
- Proof Pack purchased
- Proof Pack delivered
- Subscription opportunity
- Subscriber
- Lost

## Email automation

The sales email queue supports:

- New qualified leads
- Proof Pack onboarding
- Proof Pack delivery follow-up
- Proof Pack-to-subscription conversion
- Inactive subscribers

Run manually:

```text
/api/cron/sales-pipeline?secret=YOUR_CRON_SECRET
```

Vercel cron runs it daily at `30 9 * * *`.

Emails are skipped if the lead has no consent or is in `sales_suppression_list`.

## Compliance handling

The pipeline records:

- Region: US, UK, EU, OTHER
- Country
- Consent source
- Consent timestamp
- Consent IP
- Suppression status
- Unsubscribe reason/source

Unsubscribe links update `sales_suppression_list`, mark the lead suppressed, disable marketing consent, and skip queued emails for that address.
