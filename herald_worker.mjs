/**
 * 🤖 MarketVibe Herald Worker
 * This worker scans for 'contacted' leads and executes live posts.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// reddit.js is loaded dynamically to avoid puppeteer-core being required at startup in CI
import { postTwitterReply } from './src/lib/twitter.js';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * 📢 TWEET TEMPLATES FOR VERIFIED LAUNCHES
 */
const LAUNCH_TEMPLATES = [
    (n, t) => `🚀 JUST LAUNCHED: ${n} - ${t}. This startup just hit our "Verified" status with high revenue potential. Explore the analysis: marketvibe1.com/launchpad`,
    (n, t) => `🔥 NEW VERIFIED STARTUP: ${n} is live on the Launchpad! ${t} 📈 Full validation report & deal flow data available now. #Startup #Validation`,
    (n, t) => `💎 High-Ticket Opportunity: ${n} (${t}) has officially cleared MarketVibe verification. Check the scorecard: marketvibe1.com/launchpad`,
    (n, t) => `⚡ BREAKING: ${n} just hit the MarketVibe Launchpad. Niche focus: ${t}. Permanent Verified badge active. ✓`
];

async function tweetVerifiedLaunches() {
    console.log("📡 Herald: Scanning for new Verified Launchpad listings...");
    try {
        const { data: launches, error } = await supabase
            .from('launchpad_listings')
            .select('*')
            .eq('tier', 'validated')
            .eq('is_posted', false)
            .limit(3);

        if (error) {
            if (error.message.includes('column "is_posted" does not exist')) {
                console.warn("⚠️ Launchpad 'is_posted' column missing. Skipping launches.");
                return;
            }
            throw error;
        }

        if (!launches || launches.length === 0) {
            console.log("✅ No new Verified launches to announce.");
            return;
        }

        for (const launch of launches) {
            const template = LAUNCH_TEMPLATES[Math.floor(Math.random() * LAUNCH_TEMPLATES.length)];
            const tweetText = template(launch.name, launch.tagline);

            console.log(`🐦 Herald: Tweeting launch announcement for ${launch.name}...`);
            const result = await postTwitterReply(tweetText);

            if (result.success) {
                try {
                    await supabase
                        .from('launchpad_listings')
                        .update({ is_posted: true, posted_at: new Date().toISOString() })
                        .eq('id', launch.id);
                    console.log(`✅ Herald: Announced ${launch.name} on Twitter.`);
                } catch (e) {
                    console.log(`⚠️ Herald: Tweet sent but failed to update DB: ${e.message}`);
                }
            } else {
                console.error(`❌ Herald: Failed to tweet launch for ${launch.name}: ${result.error}`);
            }

            // Small gap between multiple launches
            if (launches.indexOf(launch) < launches.length - 1) {
                await new Promise(r => setTimeout(r, 60000));
            }
        }
    } catch (err) {
        console.error("❌ Herald Launches Error:", err.message);
    }
}

async function runHeraldCycle() {
    console.log("🚀 Herald Worker: Starting live engagement cycle...");
    // 0. Announce high-tier launches first
    await tweetVerifiedLaunches();

    try {
        // 1. Fetch leads that are 'contacted' but not yet live-posted
        // Increased limit to clear backlog (Phase 32 Refresh)
        const { data: leads, error: fetchError } = await supabase
            .from('growth_leads')
            .select('*')
            .eq('status', 'contacted')
            .eq('is_posted', false)
            .limit(15);

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
                const { postRedditReply } = await import('./src/lib/reddit.js');
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
            } else if (result.error === 'THREAD_LOCKED' || result.error === 'REDDIT_ERROR') {
                // 🛡️ FAIL-ONCE LOGIC: Mark as "posted" but with error in timestamp/last_error to remove from queue
                console.log(`⚠️ Herald: Skipping blocked thread for ${lead.username} (${result.error})`);
                await supabase
                    .from('growth_leads')
                    .update({
                        is_posted: true,
                        posted_at: `FAILED: ${result.error} at ${new Date().toISOString()}`
                    })
                    .eq('id', lead.id);
            } else if (result.error === 'EXPIRED_COOKIE') {
                console.log(`🔑 Herald: Session expired. Please refresh your REDDIT_SESSION_COOKIE in .env`);
                break;
            } else {
                console.log(`❌ Herald Error for ${lead.username}: ${result.error}`);
                // For unknown errors, we don't mark as posted so we can retry later unless it's a browser error
                if (result.error === 'TIMEOUT' || result.error === 'BROWSER_ERROR') {
                    console.log("🛑 Browser issue detected. Stopping batch.");
                    break;
                }
            }

            // Humanistic gap between posts (5 - 12 minutes)
            // If it's a small batch or user-triggered, this could be shortened, but safety first.
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
const isDirectRun = process.argv[1] && (import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) || import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop()));

if (isDirectRun) {
    runHeraldCycle().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error("CRITICAL HERALD ERROR:", err);
        process.exit(1);
    });
}
