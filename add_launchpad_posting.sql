-- Add posting tracking to launchpad listings
ALTER TABLE launchpad_listings 
ADD COLUMN IF NOT EXISTS is_posted BOOLEAN DEFAULT false;

ALTER TABLE launchpad_listings 
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
