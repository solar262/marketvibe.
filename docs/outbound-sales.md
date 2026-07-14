# MarketVibe UK/US B2B Outbound

MarketVibe outbound is designed for compliant cold email to qualified UK and US business prospects that could buy a Proof Pack or recurring Radar subscription.

It does not automate LinkedIn visits, messages, connection requests, or engagement.

## Admin portal

Open:

```text
/admin/outbound
```

The automated workflow is:

1. `/api/cron/outbound-autopilot` discovers buyer prospects from approved public sources.
2. MarketVibe imports each public business email into the outbound pipeline.
3. MarketVibe classifies region, recipient type, lawful basis, and permission status.
4. UK/US business contacts that pass the gates are approved and queued.
5. `/api/cron/sales-pipeline` sends due emails when outbound sending is enabled.

Manual CSV remains available only as a fallback:

1. Paste or upload buyer-prospect CSV rows.
2. MarketVibe classifies region, recipient type, lawful basis, and permission status.
3. Only approved UK/US business contacts can be selected.
4. Approve selected rows.
5. Queue selected rows.
6. `/api/cron/sales-pipeline` sends due emails when outbound sending is enabled.

The portal is compatible with the existing `sales_leads` schema. Outbound-specific fields are stored in `metadata.marketvibeOutbound`, so the system can run before the optional clean-schema migration is applied.

## CSV columns

Required:

```text
email
companyName
country or region
sourceUrl
sourceEvidence
```

Recommended:

```text
name
website
targetIndustry
companySize
serviceOffered
averageClientValue
weeklyOutreachCapacity
currentLeadGenerationMethod
```

Example:

```csv
email,name,companyName,website,country,region,sourceUrl,sourceEvidence,targetIndustry,companySize
founder@exampleagency.com,Sam Founder,Example Agency,https://exampleagency.com,United Kingdom,UK,https://exampleagency.com/careers,Hiring a business development manager,AI automation consultants,2-15
growth@exampleconsulting.com,Alex Growth,Example Consulting,https://exampleconsulting.com,United States,US,https://exampleconsulting.com/services,Launched a new RevOps service page,RevOps consultants,2-15
```

## Send controls

Outbound sending is paused unless this is set:

```text
SALES_OUTBOUND_ENABLED=true
```

Recommended production settings:

```text
SALES_OUTBOUND_ALLOWED_REGIONS=UK,US
SALES_OUTBOUND_DAILY_LIMIT=250
SALES_OUTBOUND_POSTAL_ADDRESS="Your valid postal address"
SALES_PIPELINE_UNSUBSCRIBE_SECRET="a long random secret"
SALES_OUTBOUND_AUTOPILOT_ENABLED=true
SALES_OUTBOUND_AUTOPILOT_MARKETS=5
SALES_OUTBOUND_AUTOPILOT_LEADS_PER_MARKET=10
SALES_OUTBOUND_AUTOPILOT_QUEUE_LIMIT=250
SALES_OUTBOUND_REPORT_EMAIL="owner@example.com"
```

The system still checks suppression, unsubscribe tokens, business email domains, source evidence, region, compliance status, and daily limits before sending.

The scheduled outbound cron routes use these environment values by default. Query parameters are only for one-off testing. Production runs five daily cron windows each weekday and rotates market coverage so each run works a different slice of the UK/US ICP pool.

Daily reporting is sent by `/api/cron/outbound-daily-report` after the final weekday outbound window. It emails `SALES_OUTBOUND_REPORT_EMAIL`, falling back to `ADMIN_EMAIL`, and includes new prospects, contacted leads, sent/failed/skipped counts, queued emails, suppressions, and recent contacted companies.

## Automatic blocks

Rows are blocked or held for review when they are:

- EU or other non-UK/US regions
- personal/free email domains
- sole traders or unclear recipient type
- missing source URL
- missing source evidence
- already unsubscribed or suppressed

## Go-live checklist

Before enabling live sending:

1. Confirm the existing sales pipeline migration is already live. The optional `0013_uk_us_cold_outbound.sql` migration can be applied later for physical columns.
2. Confirm Brevo sender domain and sender email are verified.
3. Add the postal address env var for US sending.
4. Run `/api/cron/outbound-autopilot?dryRun=true`.
5. Confirm only approved UK/US business contacts can be queued.
6. Run `/api/cron/outbound-autopilot` manually.
7. Run the sales-pipeline cron manually.
8. Check the first sent email in Brevo.
9. Watch deliverability, replies, bounces, unsubscribes, and complaints daily. Reduce the daily limit if sender reputation weakens.
