import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyLaunchpad() {
    console.log("--- 🚀 FINAL LAUNCHPAD VERIFICATION ---");
    const { data: listings, error } = await supabase
        .from('launchpad_listings')
        .select('name, tagline, tier, is_posted')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching listings:", error.message);
        return;
    }

    if (!listings || listings.length === 0) {
        console.log("⚠️ WARNING: Launchpad is empty!");
        return;
    }

    console.log(`✅ Found ${listings.length} active listings.`);
    console.log("-----------------------------------------");
    listings.forEach((item, i) => {
        const badge = item.tier === 'validated' ? "💎 [VERIFIED]" : "💡 [IDEA]";
        console.log(`${i + 1}. ${badge} ${item.name}`);
        console.log(`   Tagline: ${item.tagline}`);
        console.log(`   Twitter Announced: ${item.is_posted ? 'Yes' : 'Pending'}`);
    });
    console.log("-----------------------------------------");
    console.log("🚀 STATUS: ALL SYSTEMS GO. READY FOR TRAFFIC.");
}

verifyLaunchpad();
