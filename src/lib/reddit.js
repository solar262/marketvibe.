/**
 * 🤖 MarketVibe Reddit Herald
 * This module handles live Reddit posting via official API.
 */

import dotenv from 'dotenv';
dotenv.config();

export const postRedditReply = async (postId, content) => {
    const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD } = process.env;

    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_USERNAME || !REDDIT_PASSWORD) {
        console.warn('⚠️ Reddit API keys missing. Post queued but not sent live.');
        return { success: false, error: 'MISSING_API_KEYS' };
    }

    try {
        console.log(`📡 Reddit Herald: Posting live reply to thread ${postId}...`);

        // 1. Get OAuth Token
        const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=password&username=${encodeURIComponent(REDDIT_USERNAME)}&password=${encodeURIComponent(REDDIT_PASSWORD)}`
        });
        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            throw new Error(`Auth failed: ${tokenData.error}`);
        }

        // 2. Post the comment
        const postResponse = await fetch('https://oauth.reddit.com/api/comment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MarketVibeHerald/0.1 by ' + REDDIT_USERNAME
            },
            body: `parent=t3_${postId}&text=${encodeURIComponent(content)}`
        });
        const postData = await postResponse.json();

        if (postData.json?.errors?.length > 0) {
            throw new Error(JSON.stringify(postData.json.errors));
        }

        console.log(`✅ Reddit Herald: Live reply posted successfully to ${postId}!`);
        return { success: true, data: postData };

    } catch (err) {
        console.error('❌ Reddit Herald Error:', err.message);
        return { success: false, error: err.message };
    }
};
