
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

async function generateMorningBrief() {
    const timestamp = new Date().toLocaleString();
    console.log(`\n--- 👔 GENERATING CEO MORNING BRIEF: ${timestamp} ---`);

    try {
        // 1. Fetch Stats (Last 24 Hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { count: newLeads } = await supabase
            .from('growth_leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday);

        const { count: hqLeads } = await supabase
            .from('growth_leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday)
            .gte('interest_score', 9);

        const { data: hitsData } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'website_hits')
            .single();

        const { count: totalLeads } = await supabase
            .from('growth_leads')
            .select('*', { count: 'exact', head: true });

        const { count: closedLeads } = await supabase
            .from('growth_leads')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'closed');

        const totalRevenue = (closedLeads || 0) * 49;

        // 1b. Fetch Local Growth Metrics (Guest Trials & Roaster Leads)
        const fs = require('fs');
        const path = require('path');
        const DB_ROOT = 'c:/Users/qwerty/Desktop/billion-fixed/saas-server/db';

        let roasterLeads = 0;
        let guestTrials = 0;
        let guestUsageCount = 0;

        try {
            const roastPath = path.join(DB_ROOT, 'roast_leads.json');
            if (fs.existsSync(roastPath)) {
                const data = JSON.parse(fs.readFileSync(roastPath, 'utf8'));
                roasterLeads = data.length;
            }

            const keysPath = path.join(DB_ROOT, 'provisioned_keys.json');
            if (fs.existsSync(keysPath)) {
                const data = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
                const guestKeys = Object.entries(data).filter(([k]) => k.startsWith('OAS-GUEST-'));
                guestTrials = guestKeys.length;
                guestUsageCount = guestKeys.reduce((acc, [_, v]) => acc + (v.usage || 0), 0);
            }
        } catch (e) {
            console.warn("⚠️ Local DB metrics failed:", e.message);
        }

        // 2. Format Email
        const subject = `📊 MarketVibe Morning Brief: +${newLeads} leads today! 🚀`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: white; padding: 2rem; border-radius: 1rem; border: 1px solid #1e293b;">
                <h1 style="color: #6366f1; margin-bottom: 0.5rem;">MarketVibe Brief 👔</h1>
                <p style="color: #94a3b8; font-size: 0.875rem;">Status update for ${new Date().toLocaleDateString()}</p>
                
                <hr style="border: 0; border-top: 1px solid #1e293b; margin: 2rem 0;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                        <span style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.5rem;">NEW LEADS</span>
                        <h2 style="margin: 0; font-size: 2rem; color: #6366f1;">+${newLeads}</h2>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                        <span style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.5rem;">HIGH INTENT 🔥</span>
                        <h2 style="margin: 0; font-size: 2rem; color: #fbbf24;">${hqLeads}</h2>
                    </div>
                </div>

                <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.5rem; border: 1px solid rgba(16, 185, 129, 0.2); text-align: center;">
                    <span style="display: block; font-size: 0.75rem; color: #10b981; margin-bottom: 0.5rem;">TOTAL PROJECT REVENUE 💰</span>
                    <h2 style="margin: 0; font-size: 2.5rem; color: #10b981;">$${totalRevenue}</h2>
                </div>

                <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="background: rgba(236, 72, 153, 0.05); padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(236, 72, 153, 0.1); text-align: center;">
                        <span style="display: block; font-size: 0.7rem; color: #ec4899; margin-bottom: 0.3rem;">ROASTER LEADS 🌶️</span>
                        <h3 style="margin: 0; color: #ec4899;">${roasterLeads}</h3>
                    </div>
                    <div style="background: rgba(14, 165, 233, 0.05); padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(14, 165, 233, 0.1); text-align: center;">
                        <span style="display: block; font-size: 0.7rem; color: #0ea5e9; margin-bottom: 0.3rem;">GUEST TRIALS 👻</span>
                        <h3 style="margin: 0; color: #0ea5e9;">${guestTrials}</h3>
                    </div>
                </div>

                <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 0.5rem;">
                    <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #cbd5e1;">📊 Website Visits: <b>${hitsData?.value || 0}</b></p>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #cbd5e1;">🎯 Total Lead Pipeline: <b>${totalLeads}</b></p>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #cbd5e1;">🛠️ Demo Usage (Total): <b>${guestUsageCount} generations</b></p>
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <a href="https://www.marketvibe1.com/admin/leads" style="display: inline-block; background: #6366f1; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: bold;">Enter Commander Center 🤖</a>
                </div>
                
                <p style="margin-top: 3rem; text-align: center; color: #475569; font-size: 0.75rem;">
                    This is an autonomous report generated by the MarketVibe Reporting Agent.
                </p>
            </div>
        `;

        // 3. Send Email (To the founder)
        const recipient = process.env.FOUNDER_EMAIL || 'founder@marketvibe1.com';
        await resend.emails.send({
            from: 'reporting@marketvibe1.com',
            to: recipient,
            subject: subject,
            html: html
        });

        console.log(`✅ Morning Brief sent to ${recipient}`);

    } catch (err) {
        console.error("\n❌ REPORTING FAILED:", err.message);
    }
}

generateMorningBrief();
