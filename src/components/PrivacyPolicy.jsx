import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', color: '#cbd5e1', lineHeight: '1.6' }}>
            <h1 style={{ color: 'white', marginBottom: '2rem' }}>Privacy Policy</h1>
            <p>Last Updated: February 15, 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>1. Information We Collect</h2>
                <p>We collect information you provide directly to us when you use MarketVibe, including your email address and any project details you submit for validation.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>2. How We Use Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Provide, maintain, and improve our services.</li>
                    <li>Generate validation reports and 30-day blueprints.</li>
                    <li>Send transactional emails and nurture sequences.</li>
                    <li>Process payments via Stripe.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>3. Data Sharing</h2>
                <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., Stripe for payments, Resend for email) or as required by law.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>4. Security</h2>
                <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>5. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at: support@marketvibe1.com</p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
