# MarketVibe1 Launch Checklist

## Completed Automatically

- [x] Protected Sales Navigator CSV importer exists at `/admin/import`.
- [x] Importer does not perform LinkedIn scraping or login automation.
- [x] Importer has CSV limits, validation, dedupe, SSRF blocking, evidence labels, and formula-safe CSV export.
- [x] Dashboard access no longer relies on email alone.
- [x] Proof Pack CSV access checks secure session/token access.
- [x] Stripe Customer Portal endpoint exists.
- [x] Radar now routes through onboarding.
- [x] FAQ/support assistant uses approved local content only.
- [x] Missing help/policy pages were added.
- [x] Operator runbooks were added.

## Operator Action Required

- [ ] Apply `supabase/migrations/0008_sales_navigator_import.sql` to staging/production Supabase.
- [ ] Verify importer tables exist and RLS is enabled.
- [ ] Configure Stripe Customer Portal.
- [ ] Configure Stripe webhook endpoint to one webhook route.
- [ ] Run Stripe test checkout for Proof Pack, Radar, and Growth Desk.
- [ ] Submit onboarding for each self-service product.
- [ ] Publish one test Proof Pack/imported delivery to a test customer.
- [ ] Confirm the test customer can open only their own dashboard/CSV.
- [ ] Confirm cancellation through Stripe Customer Portal.
- [ ] Confirm failed payment behavior.

## Credentials Required

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Supabase migration access
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `BREVO_API_KEY`
- [ ] `BREVO_SENDER_EMAIL`
- [ ] `BREVO_SENDER_NAME`
- [ ] `BREVO_MARKETVIBE_LIST_ID`
- [ ] `ADMIN_EMAIL`
- [ ] `ADMIN_PASSWORD`
- [ ] `CUSTOMER_ACCESS_SECRET`

## Legal Information Required

- [ ] Legal entity name
- [ ] Registered address
- [ ] VAT/tax number, if applicable
- [ ] Company registration number, if applicable
- [ ] Jurisdiction-specific refund/cancellation wording
- [ ] Data protection contact details

## Optional Post-Launch Improvements

- [ ] Add full customer account login instead of secure email links.
- [ ] Add dedicated support request table and admin reply workflow.
- [ ] Add automated email retry queue with idempotency keys.
- [ ] Add Stripe refund/dispute admin review dashboard.
- [ ] Add richer onboarding status tracking by product.
- [ ] Add production smoke tests for live public routes.
