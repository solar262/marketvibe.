import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function migrate() {
    console.log("🛠️ Running Launchpad Social Migration...");

    // Check if column exists first by trying to select it
    const { error } = await supabase
        .from('launchpad_listings')
        .select('is_posted')
        .limit(1);

    if (error && error.message.includes('column "is_posted" does not exist')) {
        console.log("🚀 'is_posted' column missing. Please run the following SQL in your Supabase Dashboard:");
        console.log(`
            ALTER TABLE launchpad_listings ADD COLUMN IF NOT EXISTS is_posted BOOLEAN DEFAULT false;
            ALTER TABLE launchpad_listings ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
        `);
    } else {
        console.log("✅ 'is_posted' column already exists or migration handled.");
    }
}

migrate();
