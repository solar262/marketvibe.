/**
 * 🤖 MarketVibe Twitter Herald
 * This module handles live X (Twitter) posting via official API v2.
 */

import dotenv from 'dotenv';
dotenv.config();

import { sendTweet } from '../../twitter_growth_bot.mjs';

export const postTwitterReply = async (content) => {
    try {
        console.log(`📡 Twitter Herald: Posting via Browser Automation...`);

        const success = await sendTweet(content);

        if (success) {
            return { success: true };
        } else {
            return { success: false, error: 'BROWSER_AUTOMATION_FAILED' };
        }

    } catch (err) {
        console.error('❌ Twitter Herald Error:', err.message);
        return { success: false, error: err.message };
    }
};
