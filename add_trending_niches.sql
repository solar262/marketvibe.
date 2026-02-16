-- PHASE 42: THE NEWSROOM (TREND-JACKING ENGINE)
-- Create storage for breakout market trends detected by the AI.

CREATE TABLE IF NOT EXISTS trending_niches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    niche TEXT UNIQUE NOT NULL,
    growth_score INTEGER DEFAULT 0, -- AI-calculated momentum (1-100)
    lead_count INTEGER DEFAULT 0, -- Number of leads found in this niche
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_breakout BOOLEAN DEFAULT FALSE,
    summary TEXT, -- AI-generated trend summary
    execution_plan JSONB -- Pre-generated validation strategy
);

-- Commentary: This table allows us to track "Rising Niches" independently of individual leads.
-- It powers the "Newsroom" dashboard and pSEO trend-jacking silos.
