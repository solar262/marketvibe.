# MarketVibe Pro

An original full-stack dropshipping marketplace inspired by the referenced public app concept. It does not copy private code, branding, or protected assets.

## What is included

- Next.js App Router, TypeScript, Tailwind CSS
- Public storefront: home, products, product detail, categories, cart, checkout, success, contact, policies
- Admin area: dashboard, products, product form, CSV import preview, orders, fulfillment, settings
- Stripe Checkout API route with demo fallback when keys are absent
- Stripe webhook route ready to mark orders paid
- Supabase client wiring, SQL schema, seed SQL, and sample CSV
- Demo admin login: `admin@marketvibepro.test` / `marketvibe123`

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Stripe setup

### Option A: Stripe Payment Link

Create a Payment Link in Stripe, then add it to `.env.local`:

```bash
STRIPE_PAYMENT_LINK_URL=https://buy.stripe.com/...
```

When this is set, checkout redirects customers to your real Stripe-hosted payment page. MarketVibe Pro appends `prefilled_email` and `client_reference_id` to the URL, so the order number is available in Stripe webhooks for reconciliation.

Important: a Stripe Payment Link charges the product/price configured inside Stripe. Use this option when you want one fixed payment link, donation/tip flow, or a Stripe-managed product bundle.

### Option B: Dynamic Stripe Checkout

For cart-specific totals, add these values to `.env.local` instead:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then forward webhooks during local development:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The webhook handler listens for `checkout.session.completed`. In this demo it logs the order number; connect it to Supabase updates after enabling real persistence.

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
