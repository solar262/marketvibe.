import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', color: '#cbd5e1', lineHeight: '1.6' }}>
            <h1 style={{ color: 'white', marginBottom: '2rem' }}>Privacy Policy</h1>
            <p>Last Updated: April 22, 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>1. Information We Collect</h2>
                <p>We collect information you provide directly to us when you use MarketVibe, including your email address and any project details you submit for validation.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>2. Google AdSense & Cookies</h2>
                <p>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</p>
                <p style={{ marginTop: '0.5rem' }}>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.</p>
                <p style={{ marginTop: '0.5rem' }}>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>Ads Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>www.aboutads.info</a>.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>3. How We Use Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Provide, maintain, and improve our services.</li>
                    <li>Generate validation reports and 30-day blueprints.</li>
                    <li>Send transactional emails and nurture sequences.</li>
                    <li>Process payments via Stripe.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>4. Data Sharing</h2>
                <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., Stripe for payments, Resend for email) or as required by law.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>5. Security</h2>
                <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>6. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at: support@marketvibe1.com</p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
