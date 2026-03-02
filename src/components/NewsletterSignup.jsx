import React from 'react';

const NewsletterSignup = ({ inline = false }) => {
    const subscribeUrl = import.meta.env.VITE_BEEHIIV_SUBSCRIBE_URL || 'https://marketvibe.beehiiv.com/subscribe';

    if (inline) {
        return (
            <div style={{
                background: 'rgba(99, 102, 241, 0.05)',
                padding: '2.5rem',
                borderRadius: '24px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                textAlign: 'center',
                margin: '2rem 0'
            }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>📬 The MarketVibe Intelligence Report</h3>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                    Join 2,500+ founders getting daily breakout niches, competitor teardowns, and revenue blueprints.
                </p>
                <a 
                    href={subscribeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ display: 'inline-block', textDecoration: 'none' }}
                >
                    Join the Intelligence Report →
                </a>
            </div>
        );
    }

    return (
        <section style={{ padding: '6rem 0', textAlign: 'center' }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                padding: '4rem 2rem',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    color: '#a5b4fc', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '2rem', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    display: 'inline-block',
                    marginBottom: '1.5rem'
                }}>
                    WEEKLY INSIGHTS
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1.25rem', color: '#fff' }}>Don't miss the next gold mine.</h2>
                <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                    We scan 10,000+ Reddit threads so you don't have to. Get the weekly 'Founders Intelligence' report delivered to your inbox.
                </p>
                <a 
                    href={subscribeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ 
                        display: 'inline-block', 
                        textDecoration: 'none',
                        padding: '1rem 2.5rem',
                        fontSize: '1.1rem'
                    }}
                >
                    Subscribe for Free
                </a>
                <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#475569' }}>
                    Join 2,500+ builders. No spam, just alpha.
                </p>
            </div>
        </section>
    );
};

export default NewsletterSignup;
