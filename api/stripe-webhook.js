import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export const config = {
    api: {
        bodyParser: false, // Required for Stripe signature verification
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("❌ Missing STRIPE_WEBHOOK_SECRET");
        return res.status(500).send('Webhook Secret Not Configured');
    }

    let event;

    try {
        const rawBody = await buffer(req);
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔔 Received Stripe Webhook: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // This is primarily how we identify the user who paid
        const email = session.customer_email || session.customer_details?.email;

        if (!email) {
            console.error("❌ Checkout session completed but no email found.");
            return res.status(400).send('No email associated with session');
        }

        console.log(`💰 Payment successful for: ${email}`);

        try {
            // 1. Update Database (Mark as Paid)
            const { error: dbError } = await supabase
                .from('leads')
                .update({ paid: true })
                .eq('email', email);

            if (dbError) {
                console.error(`❌ DB Update Error for ${email}:`, dbError);
                // We don't fail the webhook if DB fails, we still want to try sending the email
            } else {
                console.log(`✅ Marked ${email} as paid in database.`);
            }

            // 2. Fulfill Order via Resend
            const apiKey = process.env.VITE_RESEND_API_KEY;
            if (apiKey) {
                const ACCESS_LINK = process.env.VITE_SITE_URL || 'https://marketvibe1.com';

                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        from: 'MarketVibe Access <founder@marketvibe1.com>',
                        to: [email],
                        subject: `🎉 Your MarketVibe Data Pack is Ready!`,
                        text: `Thank you for your purchase!\n\nYou can access your complete data pack and validation reports here: ${ACCESS_LINK}/dashboard\n\nIf you have any questions, reply to this email!`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 2rem; border-radius: 12px;">
                                <h2 style="color: #10b981;">Payment Successful 🎉</h2>
                                <p>Hi there,</p>
                                <p>Thank you for upgrading your MarketVibe account. Your payment was processed successfully.</p>
                                <p>Your premium features, including the full 30-day execution playbook and raw data packs, are now unlocked.</p>
                                <div style="margin: 2.5rem 0; text-align: center;">
                                    <a href="${ACCESS_LINK}/dashboard" style="background: #10b981; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
                                </div>
                                <p>If you have any questions or need support, simply reply to this email.</p>
                            </div>
                        `
                    })
                });

                if (response.ok) {
                    console.log(`✅ Fulfillent email sent to ${email}`);
                } else {
                    const errData = await response.json();
                    console.error(`❌ Resend Error:`, errData);
                }
            } else {
                console.warn("⚠️ No Resend API key found, email not sent.");
            }

        } catch (fulfillmentError) {
            console.error(`❌ Fulfillment Catch Block Error:`, fulfillmentError);
            return res.status(500).send('Fulfillment Error');
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
}
