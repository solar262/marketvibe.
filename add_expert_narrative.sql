-- PHASE 39: AUTHORITY CONTENT ENGINE
-- Add storage for programmatic expert deep dives.

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS expert_narrative TEXT;

-- Commentary: This column stores the AI-generated 500-word deep dive analysis 
-- for high-score validations, used to power the "Authority Hub."
