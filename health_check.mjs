/**
 * 🏥 MarketVibe Health Check
 * Verifies all systems are ready for autonomous operation.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: 'c:/Users/qwerty/Desktop/prototype/.env' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkHealth() {
    console.log("--- 🏥 MarketVibe System Health Check ---");
    let healthy = true;

    // 1. Check Supabase Connection
    try {
        const { count, error } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true });
        if (error) throw error;
        console.log("✅ Supabase: Connected (Found", count || 0, "leads)");
    } catch (err) {
        console.error("❌ Supabase: Connection Failed -", err.message);
        healthy = false;
    }

    // 2. Check Environment Variables
    const requiredEnv = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_RESEND_API_KEY',
    ];

    requiredEnv.forEach(env => {
        if (!process.env[env]) {
            console.error(`❌ Env: Missing ${env}`);
            healthy = false;
        } else {
            console.log(`✅ Env: ${env} is set.`);
        }
    });

    // 3. Check Resend API
    if (process.env.VITE_RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.VITE_RESEND_API_KEY);
            // Just a dummy check if we can initialize it (Resend doesn't have a simple "ping" endpoint for keys without sending)
            console.log("✅ Resend: API Key present");
        } catch (err) {
            console.error("❌ Resend: Initialization Failed");
            healthy = false;
        }
    }

    // 4. Check Tables (Phase 32 & 39)
    const tablesToCheck = ['growth_leads', 'leads', 'trending_niches'];
    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code === '42P01') {
            console.error(`❌ Table: '${table}' NOT found.`);
            healthy = false;
        } else {
            console.log(`✅ Table: '${table}' exists.`);
        }
    }

    // 5. Check "Shadow Reputation" Columns
    const { error: columnError } = await supabase.from('growth_leads').select('is_posted').limit(1);
    if (columnError) {
        if (columnError.message && columnError.message.includes('column "is_posted" does not exist')) {
            console.warn("⚠️ Column: 'is_posted' missing in 'growth_leads'. (Live Engagement will be skipped)");
        } else {
            console.error("❌ Column check error:", columnError);
            healthy = false;
        }
    } else {
        console.log("✅ Column: 'is_posted' exists.");
    }

    console.log("-----------------------------------------");
    if (healthy) {
        console.log("🚀 SYSTEM HEALTHY: Auto Pilot ready for takeoff.");
    } else {
        console.warn("⚠️ SYSTEM UNHEALTHY: Some components may fail.");
    }
    console.log("-----------------------------------------");

    return healthy;
}

if (process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
    checkHealth().then(isHealthy => process.exit(isHealthy ? 0 : 1));
}

export { checkHealth };
