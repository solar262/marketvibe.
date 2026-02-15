import { Resend } from 'resend';

const apiKey = import.meta.env.VITE_RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export const sendWelcomeEmail = async (email) => {
    if (!resend) {
        console.warn('Resend client not initialized. Skipping welcome email.');
        return { success: false, error: 'Missing API Key' };
    }
    try {
        const { data, error } = await resend.emails.send({
            from: 'MarketVibe <onboarding@resend.dev>',
            to: [email],
            subject: 'Welcome to MarketVibe! 🎉',
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6366f1;">Welcome to MarketVibe!</h1>
                    <p>Thanks for claiming your lifetime deal. We're excited to have you on board!</p>
                    <p>MarketVibe is designed to help you validate your ideas fast. Over the next few days, we'll send you some tips on how to get the most out of the platform.</p>
                    <div style="margin: 2rem 0;">
                        <a href="https://marketvibe.io/dashboard" style="background: #6366f1; color: white; padding: 0.75rem 1.5rem; text-decoration: none; borderRadius: 8px; font-weight: bold;">Access Your Dashboard</a>
                    </div>
                    <p>If you have any questions, just reply to this email.</p>
                    <footer style="margin-top: 3rem; font-size: 0.8rem; color: #666;">
                        &copy; 2026 MarketVibe. Built for builders.
                    </footer>
                </div>
            `,
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error sending email:', err);
        return { success: false, error: err };
    }
};

export const sendResultsEmail = async (email, projectName) => {
    if (!resend) {
        console.warn('Resend client not initialized. Skipping results email.');
        return { success: false, error: 'Missing API Key' };
    }
    const resultsUrl = `https://marketvibe.vercel.app/?view_results=${encodeURIComponent(email)}`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'MarketVibe <onboarding@resend.dev>',
            to: [email],
            subject: `Your ${projectName} Validation Report is Ready! 🚀`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6366f1;">Your Analysis is Complete!</h1>
                    <p>Great news! We've finished analyzing your idea for <strong>${projectName}</strong>.</p>
                    <p>You can view your full Lead Magnet strategy and Revenue Forecast at any time using the link below:</p>
                    <div style="margin: 2rem 0; text-align: center;">
                        <a href="${resultsUrl}" style="background: #6366f1; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View My Full Report</a>
                    </div>
                    <p style="font-size: 0.9rem; color: #666;">Tip: You can also download a PDF version of your report from the results page.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;" />
                    <p>Keep building,</p>
                    <p>The MarketVibe Team</p>
                    <footer style="margin-top: 3rem; font-size: 0.8rem; color: #666;">
                        &copy; 2026 MarketVibe. Built for builders.
                    </footer>
                </div>
            `,
        });

        if (error) {
            console.error('Error sending results email:', error);
            return { success: false, error };
        }

        console.log('Results email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error sending results email:', err);
        return { success: false, error: err };
    }
};
