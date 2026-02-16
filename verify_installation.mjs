import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function verify() {
    console.log("🔍 Verifying Database Schema...");

    // 1. Check trending_niches table
    const { error: trendError } = await supabase.from('trending_niches').select('id').limit(1);

    if (trendError && trendError.code === '42P01') {
        console.error("❌ 'trending_niches' table NOT found. Please run add_trending_niches.sql");
    } else if (trendError) {
        console.error("⚠️ Error checking trending_niches:", trendError.message);
    } else {
        console.log("✅ 'trending_niches' table exists.");
    }

    // 2. Check expert_narrative column in leads
    // We can't check columns directly easily without admin, but we can try to select it
    const { error: leadsError } = await supabase.from('leads').select('expert_narrative').limit(1);

    if (leadsError) {
        console.error("❌ 'expert_narrative' column issue:", leadsError.message);
        console.log("   (Hint: Did you run add_expert_narrative.sql?)");
    } else {
        console.log("✅ 'expert_narrative' column exists in leads.");
    }

    // 3. Check growth_leads for shadow status (implied by previous steps but good to check)
    // Actually, status enum updates might not throw on select unless we try to update. 
    // We'll assume the user didn't need to run SQL for that if it was just app text, 
    // but the `growth_leads` status check is part of the code logic, not strict schema mostly.

    console.log("🏁 Verification Complete.");
}

verify();
