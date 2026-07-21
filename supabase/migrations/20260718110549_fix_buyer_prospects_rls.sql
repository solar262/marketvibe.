-- Enable Row-Level Security for the buyer_prospects table
ALTER TABLE public.buyer_prospects ENABLE ROW LEVEL SECURITY;

-- The MarketVibe Pro application accesses buyer_prospects exclusively 
-- server-side using the service_role key (e.g. in src/lib/outreach.ts).
-- Therefore, we intentionally do NOT create any policies for the 'anon' 
-- or 'authenticated' roles. This prevents any public exposure of 
-- prospect names, emails, company information, or other buyer data.
