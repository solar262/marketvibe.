-- 🛡️ MarketVibe: Database Sync Unlock
-- Run this in your Supabase SQL Editor to allow the dashboard to update lead statuses.

-- 1. Enable RLS on the table (if not already enabled)
ALTER TABLE growth_leads ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for anon" ON growth_leads;
DROP POLICY IF EXISTS "Allow public update" ON growth_leads;

-- 3. Create a clean "Public Access" policy
-- This allows your dashboard (which uses the anon key) to read and update leads.
CREATE POLICY "Enable all access for anon" 
ON growth_leads 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- 4. Grant explicit table permissions to the anon role
GRANT ALL ON TABLE growth_leads TO anon;
GRANT ALL ON TABLE growth_leads TO authenticated;
GRANT ALL ON TABLE growth_leads TO service_role;

-- 5. Grant sequence permissions (for ID generation if needed)
GRANT USAGE, SELECT ON SEQUENCE growth_leads_id_seq TO anon;

-- 🏁 Security Unlock Complete!
-- Your dashboard should now be able to move leads between tabs in real-time.
