CREATE TABLE IF NOT EXISTS premium_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'csv_import',
  original_filename text,
  status text NOT NULL DEFAULT 'previewed',
  total_rows integer NOT NULL DEFAULT 0,
  valid_rows integer NOT NULL DEFAULT 0,
  imported_rows integer NOT NULL DEFAULT 0,
  duplicate_rows integer NOT NULL DEFAULT 0,
  rejected_rows integer NOT NULL DEFAULT 0,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS premium_imported_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES premium_import_batches(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  full_name text,
  job_title text,
  company_name text NOT NULL,
  company_domain text,
  company_website text,
  linkedin_profile_url text,
  company_linkedin_url text,
  location text,
  country text,
  city text,
  industry text,
  company_size text,
  public_email text,
  public_phone text,
  public_signal_url text,
  public_signal_text text,
  source_note text,
  raw_row jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL UNIQUE,
  fit_score integer NOT NULL DEFAULT 0,
  intent_score integer,
  evidence_status text NOT NULL DEFAULT 'profile_only' CHECK (evidence_status IN ('profile_only', 'website_verified', 'public_signal_verified')),
  evidence_summary text NOT NULL DEFAULT 'Intent not evidenced.',
  enrichment_status text NOT NULL DEFAULT 'not_enriched' CHECK (enrichment_status IN ('not_enriched', 'enriched', 'failed', 'skipped')),
  website_scan jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_delivery_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  product_code text NOT NULL CHECK (product_code IN ('proof_pack', 'radar', 'growth_desk')),
  opportunity_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'csv_ready', 'email_failed', 'delivered', 'failed')),
  access_token_hash text,
  csv_generated_at timestamptz,
  email_sent_at timestamptz,
  error_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_prospect_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES premium_imported_prospects(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  product_code text NOT NULL CHECK (product_code IN ('proof_pack', 'radar', 'growth_desk')),
  onboarding_id uuid REFERENCES premium_onboarding(id) ON DELETE SET NULL,
  assignment_status text NOT NULL DEFAULT 'assigned' CHECK (assignment_status IN ('assigned', 'published', 'removed')),
  delivered_at timestamptz,
  delivery_batch_id uuid REFERENCES premium_delivery_batches(id) ON DELETE SET NULL,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prospect_id, customer_email, product_code)
);

CREATE INDEX IF NOT EXISTS premium_imported_prospects_batch_id_idx ON premium_imported_prospects(batch_id);
CREATE INDEX IF NOT EXISTS premium_imported_prospects_company_name_idx ON premium_imported_prospects(company_name);
CREATE INDEX IF NOT EXISTS premium_imported_prospects_linkedin_profile_url_idx ON premium_imported_prospects(linkedin_profile_url);
CREATE INDEX IF NOT EXISTS premium_imported_prospects_dedupe_key_idx ON premium_imported_prospects(dedupe_key);
CREATE INDEX IF NOT EXISTS premium_imported_prospects_fit_score_idx ON premium_imported_prospects(fit_score);
CREATE INDEX IF NOT EXISTS premium_imported_prospects_evidence_status_idx ON premium_imported_prospects(evidence_status);
CREATE INDEX IF NOT EXISTS premium_imported_prospects_review_status_idx ON premium_imported_prospects(review_status);

CREATE INDEX IF NOT EXISTS premium_prospect_assignments_customer_email_idx ON premium_prospect_assignments(customer_email);
CREATE INDEX IF NOT EXISTS premium_prospect_assignments_product_code_idx ON premium_prospect_assignments(product_code);
CREATE INDEX IF NOT EXISTS premium_prospect_assignments_delivery_status_idx ON premium_prospect_assignments(assignment_status, delivered_at);

CREATE INDEX IF NOT EXISTS premium_delivery_batches_customer_email_idx ON premium_delivery_batches(customer_email);
CREATE INDEX IF NOT EXISTS premium_delivery_batches_product_code_idx ON premium_delivery_batches(product_code);
CREATE INDEX IF NOT EXISTS premium_delivery_batches_status_idx ON premium_delivery_batches(status);

ALTER TABLE premium_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_imported_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_prospect_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_delivery_batches ENABLE ROW LEVEL SECURITY;
