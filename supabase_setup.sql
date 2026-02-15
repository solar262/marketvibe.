
-- 🛡️ MarketVibe: Atomic Hit Counter
-- Run this in your Supabase SQL Editor to enable real-time tracking.

CREATE OR REPLACE FUNCTION increment_hits()
RETURNS void AS $$
BEGIN
  UPDATE app_settings
  SET value = value + 1
  WHERE key = 'website_hits';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
