-- MarketVibe: Investor Interest Table (Fixed)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS investor_interest (
    id BIGSERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES launchpad_listings(id) ON DELETE CASCADE,
    listing_name TEXT,
    founder_email TEXT,
    investor_email TEXT,
    expressed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups per listing
CREATE INDEX IF NOT EXISTS idx_investor_interest_listing ON investor_interest(listing_id);

-- Enable Row Level Security
ALTER TABLE investor_interest ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (investors clicking Express Interest)
CREATE POLICY "Allow investor interest inserts"
    ON investor_interest FOR INSERT
    WITH CHECK (true);

-- Allow reading all interest records
CREATE POLICY "Allow reading interest"
    ON investor_interest FOR SELECT
    USING (true);

-- Add investor_views counter to launchpad_listings (if not already there)
ALTER TABLE launchpad_listings
    ADD COLUMN IF NOT EXISTS investor_views INTEGER DEFAULT 0;
