-- MarketVibe Launchpad Directory Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS launchpad_listings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT DEFAULT '',
    niche TEXT DEFAULT 'SaaS',
    url TEXT DEFAULT '',
    founder_email TEXT NOT NULL,
    founder_name TEXT DEFAULT 'Anonymous Founder',
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'featured', 'validated')),
    upvotes INTEGER DEFAULT 0,
    revenue_potential TEXT DEFAULT '',
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE launchpad_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved listings
CREATE POLICY "Public can read approved listings"
ON launchpad_listings FOR SELECT
USING (status = 'approved');

-- Anyone can insert (submit) listings
CREATE POLICY "Anyone can submit listings"
ON launchpad_listings FOR INSERT
WITH CHECK (true);

-- Anyone can update upvotes
CREATE POLICY "Anyone can upvote"
ON launchpad_listings FOR UPDATE
USING (true)
WITH CHECK (true);

-- RPC function to increment upvotes atomically
CREATE OR REPLACE FUNCTION increment_upvotes(listing_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE launchpad_listings
    SET upvotes = upvotes + 1
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some initial listings from existing validation data (optional)
-- INSERT INTO launchpad_listings (name, tagline, niche, founder_email, tier, upvotes, status)
-- VALUES
--     ('AI Content Scheduler', 'Automate your social media with AI-powered scheduling', 'AI', 'seed@example.com', 'featured', 12, 'approved'),
--     ('InvoiceFlow', 'Smart invoicing for freelancers — get paid faster', 'FinTech', 'seed@example.com', 'validated', 8, 'approved');
