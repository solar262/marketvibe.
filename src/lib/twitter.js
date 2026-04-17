/**
 * 🤖 MarketVibe Twitter Herald
 * This module handles live X (Twitter) posting via official API v2.
 */

import dotenv from 'dotenv';
dotenv.config();

import { replyToTweetById } from '../../twitter_growth_bot.mjs';

export const postTwitterReply = async (content, tweetId = null) => {
    try {
        if (tweetId) {
            console.log(`📡 Twitter Herald: Posting direct reply to ${tweetId}...`);
            const success = await replyToTweetById(tweetId, content);
            return success ? { success: true } : { success: false, error: 'DIRECT_REPLY_FAILED' };
        }

        console.log(`📡 Twitter Herald: No tweetId provided. Skipping...`);
        return { success: false, error: 'MISSING_TWEET_ID' };

    } catch (err) {
        console.error('❌ Twitter Herald Error:', err.message);
        return { success: false, error: err.message };
    }
};
