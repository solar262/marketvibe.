# MarketVibe1 Production Readiness

Last local readiness pass: 2026-07-10

## Confirmed Working Locally

- Sales Navigator CSV importer remains present and protected at `/admin/import`.
- Importer tests cover delimiter detection, mapping, malformed CSV, row/file limits, dedupe, private URL blocking, evidence classification, cross-customer delivery token checks, and CSV export formula neutralization.
- Stripe checkout code creates server-side Checkout Sessions for Proof Pack, Radar, and Growth Desk.
- Stripe webhook handler verifies signatures when `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured.
- Stripe webhook event IDs are recorded in `processed_stripe_events` to avoid duplicate processing.
- Customer dashboard no longer loads paid workspace data from email alone; it requires a verified Stripe session or signed customer access token.
- Proof Pack CSV download requires a verified Stripe session or signed customer access token, and imported CSV delivery requires a secure delivery token.
- Stripe Customer Portal route exists at `/api/billing/portal` and requires secure customer access before creating a portal session.
- FAQ, support assistant, billing help, data request, acceptable use, cookie, and security pages exist.
- Contact form no longer displays success unless the API accepts the request.

## Fixed In This Readiness Pass

- Added signed customer access tokens for dashboard and billing access.
- Added Stripe Customer Portal endpoint and dashboard button for billing management and cancellation.
- Routed Radar buyers through paid onboarding before recurring dashboard use.
- Expanded onboarding inputs for Proof Pack, Radar, and Growth Desk.
- Added support acknowledgement handling and safer contact-form error handling.
- Removed unsupported homepage customer-proof metrics and testimonial-style claims.
- Added missing public help/policy pages.
- Added simple admin daily operations view.
- Added operator runbooks and launch checklist.

## Production Tested

Not completed from this workspace. The local `.env.local` did not provide usable Supabase URL/service-role values to verify production database state, and live Stripe/Brevo production credentials were not available for end-to-end payment and email testing.

## Not Testable From This Workspace

- Applying `supabase/migrations/0008_sales_navigator_import.sql` to production/staging.
- Confirming production RLS state from Supabase catalog tables.
- Real Stripe card checkout, subscription renewal, cancellation, refund/dispute, and Customer Portal behavior.
- Real Brevo sender verification and transactional email delivery.
- Real customer dashboard delivery against production entitlements.
- Live production deployment and `https://www.marketvibe1.com` verification.

## Credentials Still Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Supabase project access or database password for migrations
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe Customer Portal configured in Stripe Dashboard
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_MARKETVIBE_LIST_ID`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CUSTOMER_ACCESS_SECRET`

## Legal Details Still Required

Do not invent these. Add only operator-supplied verified details:

- Legal entity name
- Registered business address
- VAT/tax number, if applicable
- Company registration number, if applicable
- Official support/legal email if different from `hello@marketvibe1.com`
- Any jurisdiction-specific cancellation/refund wording from counsel

## Manual Actions Still Required

1. Apply Supabase migration `supabase/migrations/0008_sales_navigator_import.sql`.
2. Confirm importer tables exist and RLS is enabled in Supabase.
3. Configure `CUSTOMER_ACCESS_SECRET` in Vercel/production.
4. Configure Stripe webhook endpoint and Customer Portal.
5. Run a Stripe test checkout for Proof Pack, Radar, and Growth Desk.
6. Confirm webhook-created orders and entitlements in Supabase.
7. Submit onboarding for each self-service product.
8. Confirm Brevo sends purchase, onboarding, support, and delivery emails.
9. Publish one test Sales Navigator CSV delivery to a test customer.
10. Verify dashboard and CSV access for the correct customer only.

## Remaining Blockers

- Supabase migration is not confirmed live.
- Brevo delivery is not confirmed live.
- Stripe payment-to-access and cancellation are not confirmed live.
- Real customer dashboard access is not confirmed with production data.
- Legal operator details are not complete.

## Rollback Instructions

Current branch work is additive and committed in Git. To roll back application code, redeploy the previous known-good commit:

`cc19c22a1307616d4e8523b946bdd547166e75b2`

If migration `0008_sales_navigator_import.sql` has been applied and must be rolled back, export any needed importer/delivery data first, then drop only the new importer tables in dependency order:

```sql
DROP TABLE IF EXISTS premium_prospect_assignments;
DROP TABLE IF EXISTS premium_delivery_batches;
DROP TABLE IF EXISTS premium_imported_prospects;
DROP TABLE IF EXISTS premium_import_batches;
```

Do not drop existing premium, lead, order, Stripe, or customer tables.

## Can Payments Safely Be Accepted?

NO. The code is closer to production-ready, but real payment, entitlement, onboarding, delivery, cancellation, Brevo, and Supabase migration checks have not been completed against production/staging credentials.
