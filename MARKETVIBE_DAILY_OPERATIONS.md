# MarketVibe1 Daily Operations

For a one-person operator. Keep it boring, repeatable, and safe.

## Morning Check

1. Open `/admin`.
2. Check:
   - new orders
   - active access
   - failed payments
   - incomplete onboarding
   - failed email deliveries
   - support/data requests
   - recent imports
3. If any card says `Check setup`, confirm Supabase credentials and migrations before relying on the count.

## See New Customers

- Open `/admin`.
- Use the New orders and Active access cards.
- Cross-check in Stripe Dashboard before making billing decisions.

## See Incomplete Onboarding

- Open `/admin`.
- Check Incomplete onboarding.
- If a customer paid but did not submit onboarding, resend the secure onboarding/access email from Stripe/Brevo context.
- Do not create fake onboarding details yourself.

## Process A Proof Pack

1. Confirm payment or active entitlement.
2. Confirm onboarding is submitted.
3. Use only verified saved signals or reviewed imported CSV records.
4. Do not pad a pack with demo companies or fabricated source URLs.
5. Publish delivery through the admin importer or existing Proof Pack delivery path.
6. Confirm the customer can open the secure dashboard/CSV link.

## Import Sales Navigator CSVs

1. Open `/admin/import`.
2. Upload the CSV.
3. Confirm column mapping.
4. Review valid, rejected, duplicate, missing-company, and missing-reference counts.
5. Confirm import.
6. Enrich only supplied public websites/source URLs.
7. Approve or reject rows.
8. Assign to the customer.
9. Publish to dashboard.
10. Confirm Brevo delivery or handle the real error shown.

Never log into LinkedIn, scrape LinkedIn, store LinkedIn cookies, or use unofficial LinkedIn APIs.

## See Failed Payments

- Open `/admin` and check Failed payments.
- Open Stripe Dashboard for invoice/customer details.
- Let Stripe Customer Portal handle payment-method updates.
- Do not manually grant access for failed payments.

## Answer Support Requests

1. Read the request in the admin operations view or support email.
2. Use FAQ/policy language.
3. Never promise results, revenue, replies, or legal conclusions.
4. Never authorize refunds automatically.
5. If unsure, reply that operator review is needed.

## Confirm Customer Access

- Ask for billing email and Stripe receipt/session context.
- Check Supabase entitlements and Stripe customer/subscription state.
- Use secure access links, not email-only dashboard URLs.

## Cancel Or Manage Billing

- Prefer Stripe Customer Portal.
- If manual help is required, open the Stripe customer record.
- Cancel according to Stripe subscription state and paid period.
- Do not edit database entitlement rows unless correcting a verified webhook/support issue.

## What Should Never Be Done Manually

- Do not create paid access without Stripe/order evidence.
- Do not paste service-role keys into client code.
- Do not send raw database exports to customers.
- Do not fabricate leads, pain points, emails, phone numbers, source URLs, testimonials, or metrics.
- Do not auto-send cold outreach from imported CSVs.
- Do not refund outside Stripe records.
- Do not ignore data correction/removal requests.
