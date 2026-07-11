# MarketVibe Automation

MarketVibe's autonomous opportunity system is additive to the existing CSV importer, Stripe checkout, Brevo email, customer dashboard, lead engine, Facebook Radar, and admin tools.

## Architecture

- `opportunities` stores the normalized opportunity lifecycle from discovery through delivery and replacement.
- `customer_search_profiles` stores paid-customer matching criteria created from onboarding and editable in the database/admin workflows.
- `opportunity_source_runs` and `opportunity_source_errors` record automation runs and source failures.
- `opportunity_assignments`, `opportunity_delivery_batches`, and `opportunity_exclusivity_reservations` control matching, delivery, and exclusivity.
- `opportunity_replacement_requests` stores customer/admin replacement requests.
- `opportunity_verification_events` records refresh and verification history.

The base system works without paid APIs. Discovery uses permitted public sources only and never falls back to generated demo companies.

## Source Adapters

Current adapters:

- Existing MarketVibe live lead engine: public OpenStreetMap/Nominatim/Overpass business data plus public website scan.
- Optional public RSS feeds from `OPPORTUNITY_RSS_FEEDS`.

CSV imports remain available through the existing Sales Navigator CSV importer, but rejected/test importer rows are marked with `is_test_data` and excluded from opportunity inventory and matching.

Optional future adapters can be added by returning `OpportunityInput` records with:

- real company identity;
- public source URL;
- stored evidence text;
- source name/type;
- capture date;
- website/domain when available.

Do not add adapters that use logged-in LinkedIn, private cookies, unofficial LinkedIn APIs, or authentication bypasses.

## Environment Variables

Required for production automation:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`: the single server-only variable MarketVibe reads for privileged Supabase writes. Use the Supabase service-role JWT or Supabase secret key value.
- `CRON_SECRET`
- `CUSTOMER_ACCESS_SECRET` recommended, otherwise existing webhook/admin secrets are used for customer access tokens.

Existing payment/email variables remain unchanged:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_MARKETVIBE_LIST_ID`

Optional:

- `OPPORTUNITY_RSS_FEEDS`: comma-separated public RSS/feed URLs.
- `OPPORTUNITY_EMAIL_TEST_MODE=1`: publish deliveries without sending Brevo email.

## Cron Routes

All new cron routes require `Authorization: Bearer $CRON_SECRET`, `x-cron-secret`, or `?secret=`. Vercel Cron supports the bearer pattern when `CRON_SECRET` is set.

- `/api/cron/opportunity-matching`
- `/api/cron/opportunity-discovery`
- `/api/cron/opportunity-verification`
- `/api/cron/opportunity-refresh`
- `/api/cron/opportunity-delivery`
- `/api/cron/opportunity-replacements`
- `/api/cron/opportunity-health`

The routes are listed in `vercel.json`.

## Scoring Logic

Scores are transparent and stored in `score_reasons`.

- Fit: niche, geography, industry, company size, role relevance, and verified company identity.
- Intent: direct requests score highest; expansion/project/funding/hiring signals score strongly; weak website or research signals score lower; profile-only records score low.
- Evidence: source URL, evidence text, website/domain verification, public signal strength, contact role, and public contact details.
- Freshness: source/capture/verification age.
- Overall: fit 30%, intent 35%, evidence 20%, freshness 15%.

Profile-only records are not eligible unless an admin deliberately enables them on a lower-confidence customer profile.

## Evidence Rules

Qualified inventory requires:

- company name;
- real website/domain or strong public company reference;
- source URL;
- evidence text;
- non-stale evidence;
- minimum score thresholds;
- no duplicate/exclusivity conflict;
- not test data.

The system rejects fake/example domains, blocked search URLs, logged-in/social-only sources used as evidence, listicle/directory-only evidence, empty evidence, stale records, unsupported profile-only claims, and duplicated records.

## Customer Matching

Onboarding creates a `customer_search_profiles` row from:

- niche;
- service;
- ideal buyer;
- geography;
- product code.

Product defaults live in `src/lib/opportunity-products.ts`:

- Proof Pack: one-off, non-exclusive, 30 records.
- Radar: weekly, customer-exclusive, 20 records.
- Growth Desk: weekly, niche-exclusive, 50 records.

Matching reads qualified inventory, applies profile filters and score thresholds, checks freshness, excludes previously delivered records, and records match reasons.

## Exclusivity

Supported modes:

- non-exclusive;
- customer-exclusive;
- niche-exclusive;
- geographic-exclusive;
- time-limited exclusive.

Active exclusivity reservations are stored in `opportunity_exclusivity_reservations`. The database has a unique active `exclusivity_key` index to block conflicting assignments.

## Delivery

`publishDueOpportunityDeliveries()` creates delivery batches, marks assignments delivered, updates opportunity status, and emails the customer through Brevo unless `OPPORTUNITY_EMAIL_TEST_MODE=1`.

Customer dashboard delivery includes:

- company;
- website;
- location;
- verified contact when available;
- source evidence and URL;
- found/verified/delivered dates;
- score explanations;
- recommended next action;
- replacement request form.

CSV export is available at `/api/opportunities/csv` and does not expose internal admin notes.

## Replacements

Customers and admins can request replacements for:

- website dead;
- company closed;
- person no longer in role;
- contact invalid;
- duplicate;
- outside agreed criteria;
- evidence unavailable;
- other.

Objective system failures such as dead websites or missing evidence can be auto-approved for system-created requests. Approved replacements preserve audit history and trigger matching for a replacement opportunity.

## Deployment Steps

1. Apply `supabase/migrations/0009_autonomous_opportunity_delivery.sql`.
2. Confirm `CRON_SECRET` is set in Vercel.
3. Confirm Supabase service-role, Stripe, and Brevo variables remain server-side only.
4. Deploy `sales-navigator-import-v1`.
5. Open `/admin/opportunity-engine`.
6. Run discovery, verification, fill shortages, and delivery in order.
7. Use `OPPORTUNITY_EMAIL_TEST_MODE=1` for safe delivery-email tests.

## Production Verification

Use the admin control centre to verify:

1. Discovery creates source-backed records only.
2. Verification writes `last_verified_at`.
3. Qualified records enter `IN_INVENTORY`.
4. Test/rejected importer rows remain excluded.
5. Matching creates assignments and exclusivity reservations.
6. Delivery appears on `/dashboard` for the paid customer.
7. `/api/opportunities/csv` contains customer-facing fields only.
8. Replacement request creates `opportunity_replacement_requests`.
9. Approved replacement preserves original assignment history.
10. Duplicate/exclusivity conflicts are blocked.

## Add Another Source Adapter

Add an adapter in `src/lib/opportunity-engine.ts` that returns `SourceCandidate[]`. It must:

- use only lawful public access or configured official API credentials;
- save original source URL and evidence text;
- never fabricate company/contact/evidence details;
- set clear `source_type` and `source_name`;
- continue safely on per-source errors;
- rely on `calculateOpportunityScores()` and `qualifyOpportunity()` before inventory.
