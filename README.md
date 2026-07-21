# MarketVibe Lead Engine

MarketVibe sells evidence-backed, high-intent business leads. The application handles public offers, Stripe Checkout integrations, lead generation via internal tools, and Brevo transactional follow-up emails.

## Current MarketVibe Products

MarketVibe offers the following products:
- **Proof Pack** — €99 one-time purchase
- **Radar** — €299/month subscription
- **Growth Desk** — €750/month subscription
- **Agency Partner** — Available via contact offer
- **Data Licence** — Available via contact offer

## Internal Tools

- **Facebook Radar** and **Reddit Radar** are internal discovery tools only. They are not customer-facing products.

## Legacy Routes

- Legacy storefront routes (e.g., e-commerce, Starter, Pro, products, checkout) are not part of the current product and are kept for historical reference only. They are redirected to the pricing page in production.

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
```

Then forward webhooks during local development:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## Supabase setup

1. Create a Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Add all required environment variables.
4. Configure Stripe webhook endpoint.
