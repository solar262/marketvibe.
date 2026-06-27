# MarketVibe Lead Engine

MarketVibe Lead Engine helps opted-in visitors and customers find public business opportunities, preview audits, purchase access through Stripe Checkout, and receive Brevo transactional follow-up emails.

## What is included

- Next.js App Router, TypeScript, Tailwind CSS
- Public funnel: home, free leads, lead search, audit previews, pricing, payment success, contact, policies
- Protected admin area for internal settings and fulfillment
- Stripe Checkout API route for audit, Starter, Pro, and cart sessions
- Stripe webhook route for buyer delivery and buyer follow-up email scheduling
- Brevo contact sync and transactional email sequences for opted-in subscribers and buyers
- Supabase client wiring, SQL schema, seed SQL, and sample CSV

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Stripe setup

Add these values to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_AUDIT_PRICE_ID=price_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

The price IDs are recommended for production. If they are not present, the checkout route creates Stripe price data for the built-in audit, Starter, and Pro offers.

Then forward webhooks during local development:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The webhook handler listens for `checkout.session.completed`, verifies the Stripe signature, updates the buyer contact in Brevo, sends the access email, and schedules buyer follow-up emails.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_marketvibe_schema.sql` in the SQL editor or through the Supabase CLI.
3. Run `scripts/seed-demo.sql` for starter settings and categories.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

## CSV import

Use `scripts/sample-products.csv` as the expected format. Required columns:

`title, description, image_url, category, supplier_url, supplier_cost, selling_price, stock, tags`

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Add all environment variables from `.env.example`.
4. Configure Stripe webhook endpoint: `https://your-domain.com/api/webhooks/stripe`.
5. Run the Supabase SQL migration before taking payments.
