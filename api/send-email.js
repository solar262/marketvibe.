export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, niche, revenuePotential } = req.body;
    const apiKey = process.env.VITE_RESEND_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing Resend API Key on server' });
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
                from: 'MarketVibe Founder <founder@marketvibe1.com>',
                to: [email],
                subject: `Professional Validation Strategy for your ${niche} venture`,
                replyTo: 'founder@marketvibe1.com',
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 2rem; border-radius: 12px;">
                        <h2 style="color: #6366f1;">Your ${niche} Growth Analysis</h2>
                        <p>Hi there,</p>
                        <p>I noticed you recently ran a market validation for your <strong>${niche}</strong> concept on MarketVibe. Our engine flagged this as a high-potential venture with an estimated <strong>${revenuePotential || '$1M+'} annual revenue ceiling</strong>.</p>
                        
                        <p>Most founders in the ${niche} space struggle with the initial go-to-market distribution, but your report indicates a strong fit for current market signals.</p>
                        
                        <p>I'm the founder of MarketVibe, and I wanted to personally offer you a <strong>Lifetime Founder’s Unlock</strong> ($49 instead of $199/yr). This gives you the full 30-day interactive execution playbook and our "GTM Blitz" strategy to land your first 10 customers.</p>
                        
                        <div style="margin: 2.5rem 0; text-align: center;">
                            <a href="${checkoutUrl}" style="background: #6366f1; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Unlock Full Growth Roadmap</a>
                        </div>

                        <p style="font-size: 0.9rem; color: #666;">
                            If you have any questions about the data or want to discuss the ${niche} niche further, just hit reply. I'm happy to help.
                        </p>

                        <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.8rem; color: #999;">
                            <strong>MarketVibe Intelligence</strong><br/>
                            Vetted Data for High-Scale Founders
                        </footer>
                    </div>
                `,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'Resend API error' });
        }

        return res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
