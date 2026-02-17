-- Add social_posted column to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS social_posted BOOLEAN DEFAULT FALSE;
