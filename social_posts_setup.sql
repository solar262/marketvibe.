-- MarketVibe: Social Posts Queue Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS social_posts (
    id BIGSERIAL PRIMARY KEY,
    platform TEXT NOT NULL DEFAULT 'Twitter/X',
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'posted', 'failed'
    scheduled_for TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queue lookups
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);

-- Enable Row Level Security
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations (admin only in production)
CREATE POLICY "Allow all social post operations"
    ON social_posts FOR ALL
    USING (true)
    WITH CHECK (true);
