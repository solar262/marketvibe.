// ⚠️ FRONTEND SECURITY ALERT: 
// Resend should ideally not be called directly from the frontend to avoid leaking API keys.
// However, to fix the "Blank Screen" (likely caused by Node.js library incompatibilities),
// we are switching to a direct fetch call to the Resend API.

const apiKey = import.meta.env.VITE_RESEND_API_KEY;

export const sendWelcomeEmail = async (email) => {
    if (!apiKey) {
        console.warn('Missing Resend API Key. Skipping email.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: 'MarketVibe <onboarding@resend.dev>',
                to: [email],
                subject: 'Welcome to MarketVibe! 🎉',
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #6366f1;">Welcome to MarketVibe!</h1>
                        <p>Thanks for claiming your lifetime deal. We're excited to have you on board!</p>
                        <p>MarketVibe is designed to help you validate your ideas fast.</p>
                        <div style="margin: 2rem 0;">
                            <a href="https://marketvibe1.com" style="background: #6366f1; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Your Dashboard</a>
                        </div>
                        <footer style="margin-top: 3rem; font-size: 0.8rem; color: #666;">
                            &copy; 2026 MarketVibe. Built for builders.
                        </footer>
                    </div>
                `,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend API error:', error);
            return { success: false, error };
        }

        const data = await response.json();
        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error sending email:', err);
        return { success: false, error: err };
    }
};

export const sendResultsEmail = async (email, projectName) => {
    if (!apiKey) {
        console.warn('Missing Resend API Key. Skipping results email.');
        return { success: false, error: 'Missing API Key' };
    }
    const resultsUrl = `https://www.marketvibe1.com/?view_results=${encodeURIComponent(email)}`;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: 'MarketVibe <onboarding@resend.dev>',
                to: [email],
                subject: `Your ${projectName} Validation Report is Ready! 🚀`,
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #6366f1;">Your Analysis is Complete!</h1>
                        <p>Great news! We've finished analyzing your idea for <strong>${projectName}</strong>.</p>
                        <div style="margin: 2rem 0; text-align: center;">
                            <a href="${resultsUrl}" style="background: #6366f1; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View My Full Report</a>
                        </div>
                        <footer style="margin-top: 3rem; font-size: 0.8rem; color: #666;">
                            &copy; 2026 MarketVibe. Built for builders.
                        </footer>
                    </div>
                `,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend API error:', error);
            return { success: false, error };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error sending results email:', err);
        return { success: false, error: err };
    }
};

export const sendRecoveryEmail = async (email, projectName) => {
    if (!apiKey) {
        console.warn('Missing Resend API Key. Skipping recovery email.');
        return { success: false, error: 'Missing API Key' };
    }
    const checkoutUrl = `https://www.marketvibe1.com/?view_results=${encodeURIComponent(email)}`;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: 'MarketVibe <onboarding@resend.dev>',
                to: [email],
                subject: `Wait! We saved your ${projectName} playbook 🎁`,
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #6366f1;">Don't leave your market data behind!</h1>
                        <p>You recently validated <strong>${projectName}</strong>, but you haven't unlocked the full resource pack yet.</p>
                        <p>We've held one of the <strong>remaining Founder Licenses</strong> for you for 24 hours. This includes the autonomous agents and ad sets specifically tuned for this niche.</p>
                        <div style="margin: 2rem 0; text-align: center;">
                            <a href="${checkoutUrl}" style="background: #10b981; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Unlock Founder Kit Now</a>
                        </div>
                        <p style="font-size: 0.9rem; color: #666;">P.S. If you're stuck on something, just reply to this email. A human from our team is standing by.</p>
                        <footer style="margin-top: 3rem; font-size: 0.8rem; color: #666;">
                            &copy; 2026 MarketVibe. Built for builders.
                        </footer>
                    </div>
                `,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend API error:', error);
            return { success: false, error };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error sending recovery email:', err);
        return { success: false, error: err };
    }
};
export const sendCloserEmail = async (email, niche, revenuePotential) => {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                niche,
                revenuePotential
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('API error:', data);
            return { success: false, error: data.error || 'Failed to send email' };
        }

        return { success: true, data: data.data };
    } catch (err) {
        console.error('Unexpected error sending closer email:', err);
        return { success: false, error: err.message || 'Network error' };
    }
};
