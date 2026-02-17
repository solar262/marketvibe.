
-- 1. Add Referral Columns to 'leads' table
ALTER TABLE leads 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by TEXT,
ADD COLUMN referrals_count INT DEFAULT 0;

-- 2. Function to increment referral count
CREATE OR REPLACE FUNCTION increment_referral(referrer_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE leads
  SET referrals_count = referrals_count + 1
  WHERE referral_code = referrer_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
