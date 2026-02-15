import React from 'react';

const TermsOfService = () => {
    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', color: '#cbd5e1', lineHeight: '1.6' }}>
            <h1 style={{ color: 'white', marginBottom: '2rem' }}>Terms of Service</h1>
            <p>Last Updated: February 15, 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>1. Acceptance of Terms</h2>
                <p>By accessing or using MarketVibe, you agree to be bound by these Terms of Service.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>2. Services Description</h2>
                <p>MarketVibe provides autonomous validation and growth tools for solo founders. Reports are generated based on AI models and market data proxies; we do not guarantee business success.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>3. Payments and Refunds</h2>
                <p>Payments are processed via Stripe. Due to the digital nature of our blueprints and reports, we generally do not offer refunds once a report has been generated and delivered.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>4. Intellectual Property</h2>
                <p>The reports generated for your specific project details are yours to use. The underlying algorithms and software of MarketVibe remain the property of MarketVibe.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>5. Limitation of Liability</h2>
                <p>MarketVibe shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
            </section>
        </div>
    );
};

export default TermsOfService;
