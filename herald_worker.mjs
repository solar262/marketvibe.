/**
 * 🤖 MarketVibe Herald Worker
 * This worker scans for 'contacted' leads and executes live posts.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { postRedditReply } from './src/lib/reddit.js';
import { postTwitterReply } from './src/lib/twitter.js';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function runHeraldCycle() {
    console.log("🚀 Herald Worker: Starting live engagement cycle...");

    try {
        // 1. Fetch leads that are 'contacted' but not yet live-posted
        // Note: is_posted column is a Phase 32 addition
        const { data: leads, error: fetchError } = await supabase
            .from('growth_leads')
            .select('*')
            .eq('status', 'contacted')
            .eq('is_posted', false)
            .limit(5); // Throttle to 5 per cycle for safety

        if (fetchError) {
            if (fetchError.message.includes('column "is_posted" does not exist')) {
                console.warn('⚠️ Database schema not yet updated for Phase 32. Skipping live posting.');
                return;
            }
            throw fetchError;
        }

        if (!leads || leads.length === 0) {
            console.log("✅ No pending live posts. Herald standing by.");
            return;
        }

        console.log(`📡 Herald: Identified ${leads.length} leads for live engagement.`);

        for (const lead of leads) {
            let result = { success: false };

            if (lead.platform === 'reddit') {
                if (process.env.ENABLE_REDDIT === 'false') {
                    console.log(`⏭️ Herald: Skipping Reddit reply for ${lead.username} (Reddit Disabled)`);
                    continue;
                }
                const redditId = lead.platform_id.replace('rd_', '');
                result = await postRedditReply(redditId, lead.draft_reply);
            } else if (lead.platform === 'twitter') {
                result = await postTwitterReply(lead.draft_reply_twitter || lead.draft_reply);
            }

            if (result.success) {
                // Mark as posted
                await supabase
                    .from('growth_leads')
                    .update({ is_posted: true, posted_at: new Date().toISOString() })
                    .eq('id', lead.id);
                console.log(`✅ Herald: Successfully posted to ${lead.username}'s thread`);
            } else if (result.error === 'MISSING_API_KEYS') {
                console.log(`⏭️ Herald: Skipping ${lead.username} (Missing credentials)`);
                break; // Stop cycle if keys are missing
            } else if (result.error === 'RATE_LIMITED') {
                console.log(`⏱️ Herald: Rate limited. Stopping cycle — will retry in ${result.waitMinutes || 10} minutes.`);
                break; // Stop cycle on rate limit
            } else if (result.error === 'EXPIRED_COOKIE') {
                console.log(`🔑 Herald: Session expired. Please refresh your REDDIT_SESSION_COOKIE in .env`);
                break;
            }

            // Humanistic gap between posts (5 - 12 minutes)
            if (leads.indexOf(lead) < leads.length - 1) {
                const gap = 300000 + Math.random() * 420000; // 5m base + up to 7m random
                const mins = (gap / 60000).toFixed(1);
                console.log(`⏳ Herald: Cooling down for ${mins} minutes before next post...`);
                await new Promise(r => setTimeout(r, gap));
            }
        }

        console.log("🏁 Herald Cycle Complete.");

    } catch (err) {
        console.error("❌ Herald Worker Error:", err.message);
    }
}

// Export for nexus
export { runHeraldCycle };

// Run immediately if called directly
const isDirectRun = import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());

if (isDirectRun) {
    runHeraldCycle().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error("CRITICAL HERALD ERROR:", err);
        process.exit(1);
    });
}
