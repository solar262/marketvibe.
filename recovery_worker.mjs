import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendRecoveryEmail } from './src/lib/email.js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

/**
 * 🕵️‍♂️ Recovery Agent (The Nurturer)
 * Identifies leads who started validation but haven't upgraded yet.
 * Sends a value-stuffed follow-up 30 minutes after abandonment.
 */
async function runRecovery() {
    console.log("🕵️‍♂️ Recovery Agent: Scanning for abandoned checkouts...");

    try {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: abandonedLeads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('paid', false)
            .eq('status', 'completed_validation')
            .lt('created_at', thirtyMinsAgo)
            .is('recovery_sent_at', null)
            .limit(10);

        if (error) throw error;

        if (!abandonedLeads || abandonedLeads.length === 0) {
            console.log("✅ No abandoned checkouts needing recovery right now.");
            return;
        }

        console.log(`🎯 Identified ${abandonedLeads.length} leads for value-recovery.`);

        for (const lead of abandonedLeads) {
            console.log(`📩 Sending recovery email to ${lead.email}...`);

            // In a real app, this sends a dynamic email with a discount or extra value
            const success = await sendRecoveryEmail(lead.email, lead.project_name);

            if (success) {
                await supabase.from('leads').update({
                    recovery_sent_at: new Date().toISOString(),
                    status: 'nurtured'
                }).eq('id', lead.id);
                console.log(`✅ Recovery sent to ${lead.email}`);
            }
        }
    } catch (err) {
        console.error("❌ Recovery Error:", err);
    }
}

runRecovery();
