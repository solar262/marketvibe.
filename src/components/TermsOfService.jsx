import React from 'react';

const TermsOfService = () => {
    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', color: '#cbd5e1', lineHeight: '1.6' }}>
            <h1 style={{ color: 'white', marginBottom: '2rem' }}>Terms of Service</h1>
            <p>Last Updated: April 22, 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>1. Acceptance of Terms</h2>
                <p>By accessing or using MarketVibe ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>2. Services Description</h2>
                <p>MarketVibe provides autonomous validation, market intelligence, and growth tools for solo founders and startups. Analysis and reports are generated based on probabilistic AI models and market proxies. While we strive for high accuracy, we do not guarantee business success or financial outcomes.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>3. User Conduct</h2>
                <p>You agree not to use the Service for any unlawful purpose. You may not attempt to reverse engineer the MarketVibe engine or use automated tools to scrape data from our platform without express written permission.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>4. Payments and Refunds</h2>
                <p>Payments are processed securely via Stripe. Due to the immediate delivery of digital intelligence reports and blueprints, all sales are final. Refunds are only issued in cases of verified technical delivery failure.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>5. Advertisements and External Links</h2>
                <p>The Service may contain advertisements (including Google AdSense) and links to third-party websites. MarketVibe is not responsible for the content, privacy policies, or practices of any third-party ads or websites.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>6. Intellectual Property</h2>
                <p>Individual reports generated using your specific data inputs are owned by you. However, the proprietary algorithms, design elements, and "MarketVibe Intelligence" branding remain the exclusive property of MarketVibe.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>7. Limitation of Liability</h2>
                <p>MarketVibe and its operators shall not be liable for any results or business decisions made based on the provided intelligence. Use the data as a directional signal, not absolute financial advice.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white' }}>8. Governing Law</h2>
                <p>These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Service operators reside, without regard to its conflict of law provisions.</p>
            </section>
        </div>
    );
};

export default TermsOfService;
