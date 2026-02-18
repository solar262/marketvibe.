/**
 * 🤖 MarketVibe Reddit Herald (Cookie Mode)
 * Posts replies to Reddit using session cookie — no API keys needed.
 * 
 * Setup: Add REDDIT_SESSION_COOKIE to .env
 * (Copy the 'reddit_session' cookie value from your browser)
 */

import dotenv from 'dotenv';
dotenv.config();

// Humanistic delay to avoid detection
const humanDelay = (min = 3000, max = 8000) =>
    new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

export const postRedditReply = async (postId, content) => {
    const cookie = process.env.REDDIT_SESSION_COOKIE;

    if (!cookie) {
        console.warn('⚠️ Reddit session cookie missing. Post queued but not sent live.');
        console.warn('   → To fix: Add REDDIT_SESSION_COOKIE to your .env');
        console.warn('   → Get it: Open Reddit in browser → F12 → Application → Cookies → copy "reddit_session"');
        return { success: false, error: 'MISSING_API_KEYS' };
    }

    try {
        // Humanistic pause before posting (3-8 seconds)
        const delay = 3000 + Math.random() * 5000;
        console.log(`⏳ Herald: Waiting ${(delay / 1000).toFixed(1)}s before posting (human behavior)...`);
        await humanDelay();

        // 1. First, fetch the modhash (CSRF token) from Reddit
        console.log(`📡 Herald: Fetching auth token...`);
        const meResponse = await fetch('https://www.reddit.com/api/me.json', {
            headers: {
                'Cookie': `reddit_session=${cookie}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        if (!meResponse.ok) {
            throw new Error(`Auth check failed: ${meResponse.status}`);
        }

        const meData = await meResponse.json();
        const modhash = meData?.data?.modhash;

        if (!modhash) {
            console.error('❌ Could not get modhash. Cookie may be expired.');
            console.error('   → Refresh: Open Reddit in browser, log in, then re-copy the cookie.');
            return { success: false, error: 'EXPIRED_COOKIE' };
        }

        console.log(`✅ Authenticated as: u/${meData.data?.name || 'unknown'}`);

        // 2. Another humanistic pause
        await humanDelay(2000, 4000);

        // 3. Post the comment
        console.log(`📡 Herald: Posting reply to thread t3_${postId}...`);
        const postResponse = await fetch('https://www.reddit.com/api/comment', {
            method: 'POST',
            headers: {
                'Cookie': `reddit_session=${cookie}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'X-Modhash': modhash
            },
            body: `parent=t3_${postId}&text=${encodeURIComponent(content)}&api_type=json`
        });

        const postData = await postResponse.json();

        if (postData.json?.errors?.length > 0) {
            const errorMsg = JSON.stringify(postData.json.errors);
            // Rate limit detection
            if (errorMsg.includes('RATELIMIT')) {
                const waitMatch = errorMsg.match(/(\d+)\s*minute/);
                const waitTime = waitMatch ? parseInt(waitMatch[1]) : 10;
                console.warn(`⏱️ Rate limited. Waiting ${waitTime} minutes before next post.`);
                return { success: false, error: 'RATE_LIMITED', waitMinutes: waitTime };
            }
            throw new Error(errorMsg);
        }

        console.log(`✅ Herald: Reply posted successfully to t3_${postId}!`);
        return { success: true, data: postData };

    } catch (err) {
        console.error('❌ Herald Error:', err.message);
        return { success: false, error: err.message };
    }
};
