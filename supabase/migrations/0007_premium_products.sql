CREATE TABLE IF NOT EXISTS premium_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  stripe_session_id text UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  customer_email text NOT NULL,
  product_code text NOT NULL CHECK (product_code IN ('proof_pack', 'radar', 'growth_desk')),
  requested_product text,
  amount_total integer,
  currency text DEFAULT 'eur',
  mode text NOT NULL CHECK (mode IN ('payment', 'subscription')),
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  product_code text NOT NULL CHECK (product_code IN ('proof_pack', 'radar', 'growth_desk')),
  status text NOT NULL DEFAULT 'active',
  source_order_id uuid REFERENCES premium_orders(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_email, product_code)
);

CREATE TABLE IF NOT EXISTS premium_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  product_code text NOT NULL CHECK (product_code IN ('proof_pack', 'radar', 'growth_desk')),
  stripe_session_id text,
  name text,
  company text,
  website text,
  niche text NOT NULL,
  country text NOT NULL,
  city text,
  territory text,
  service_offer text NOT NULL,
  ideal_buyer text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES premium_onboarding(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  product_code text NOT NULL DEFAULT 'proof_pack',
  business_name text NOT NULL,
  website text,
  source_url text,
  source_status text,
  intent_score integer NOT NULL,
  pain_point text NOT NULL,
  context text,
  outreach_angle text NOT NULL,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  stripe_object_id text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS premium_orders_customer_email_idx ON premium_orders(customer_email);
CREATE INDEX IF NOT EXISTS premium_entitlements_customer_email_idx ON premium_entitlements(customer_email);
CREATE INDEX IF NOT EXISTS premium_pack_items_customer_email_idx ON premium_pack_items(customer_email);
