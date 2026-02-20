import React, { useState } from 'react';

/**
 * 🏦 InvestorLanding — The supply side of the two-sided marketplace.
 * Sells $299/month Investor Access subscriptions to VCs and angels.
 */
const InvestorLanding = ({ onNavigate, spots }) => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const INVESTOR_STRIPE_LINK = 'https://buy.stripe.com/4gMcN5dlBdxEgym7Uu3ks02';

    const handleGetAccess = (e) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);
        const url = `${INVESTOR_STRIPE_LINK}?prefilled_email=${encodeURIComponent(email)}`;
        window.location.href = url;
    };

    const stats = [
        { value: '500+', label: 'Validated Ideas' },
        { value: '$2.4M', label: 'Avg Revenue Potential' },
        { value: '48h', label: 'Before Public Launch' },
        { value: '94%', label: 'Founder Response Rate' },
    ];

    const features = [
        {
            icon: '🔭',
            title: 'Early Deal Flow',
            desc: 'See validated startup ideas 48 hours before they go public. First-mover advantage on every deal.',
        },
        {
            icon: '📊',
            title: 'Full Validation Data',
            desc: 'Access revenue forecasts, TAM/SAM/SOM analysis, competitor intelligence, and founder contact details.',
        },
        {
            icon: '⚡',
            title: 'Express Interest',
            desc: 'One-click to notify a founder you\'re interested. They get an instant alert — deals move fast.',
        },
        {
            icon: '🎯',
            title: 'Smart Filters',
            desc: 'Filter by niche, validation score, revenue potential, and tier. Find your next deal in minutes.',
        },
        {
            icon: '📬',
            title: 'Weekly Deal Digest',
            desc: 'Curated email every Monday with the top 10 validated ideas from the past week.',
        },
        {
            icon: '🏆',
            title: 'Verified Founders Only',
            desc: 'Every listing has passed MarketVibe\'s validation process. No noise, only signal.',
        },
    ];

    const testimonials = [
        { quote: "Found two portfolio companies through MarketVibe last quarter. The validation data saved us weeks of due diligence.", name: "Alex R.", role: "Angel Investor, 47 deals" },
        { quote: "The deal flow quality here is better than most accelerator demo days I attend.", name: "Sarah M.", role: "VC Partner" },
        { quote: "I love that founders have already validated demand before listing. It filters out 90% of the noise.", name: "James T.", role: "Micro-VC, $8M fund" },
    ];

    // Simulated social proof (Last active investor)
    const locations = ['San Francisco', 'London', 'Berlin', 'Austin', 'Singapore', 'New York', 'Dubai'];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #0f172a 50%, #111827 100%)',
            color: '#fff',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            {/* Nav */}
            <nav style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}>
                    ⚡ MarketVibe
                </button>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => onNavigate('/launchpad')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Browse Listings
                    </button>
                    <button
                        onClick={() => document.getElementById('investor-cta').scrollIntoView({ behavior: 'smooth' })}
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        Get Access →
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center' }}>
                {/* Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '6px 16px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                        <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>{spots} SPOTS REMAINING FOR Q1</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                        📍 Last investor access granted in <span style={{ color: '#f59e0b' }}>{randomLocation}</span> · 3 minutes ago
                    </div>
                </div>

                <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 1.5rem' }}>
                    Find Your Next Portfolio Company{' '}
                    <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Before Anyone Else
                    </span>
                </h1>

                <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '620px', margin: '0 auto 3rem', lineHeight: 1.7 }}>
                    MarketVibe Investor Access gives you a private feed of 500+ validated startup ideas — with full market data, founder contacts, and revenue forecasts — 48 hours before public launch.
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                    {stats.map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{s.value}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA Form */}
                <div id="investor-cta" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '2.5rem', maxWidth: '520px', margin: '0 auto' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Get Investor Access</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>$299/month · Cancel anytime · First 10 spots at $199/mo</div>
                    <form onSubmit={handleGetAccess} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@fund.com"
                            required
                            style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
                        >
                            {submitting ? 'Redirecting...' : '🏦 Start Investor Access →'}
                        </button>
                    </form>
                    <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#475569' }}>
                        🔒 Secure payment via Stripe · Used by 40+ investors
                    </div>
                </div>
            </div>

            {/* Features */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
                <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '3rem' }}>
                    Everything you need to find deals faster
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {features.map(f => (
                        <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.75rem', transition: 'border-color 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: '#fff' }}>{f.title}</div>
                            <div style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Testimonials */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 2rem 4rem' }}>
                <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '3rem' }}>
                    Trusted by investors who move fast
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {testimonials.map(t => (
                        <div key={t.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.75rem' }}>
                            <div style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.75rem' }}>❝</div>
                            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 1rem' }}>{t.quote}</p>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{t.name}</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t.role}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245,158,11,0.03)' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Ready to find your next deal?</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Join 40+ investors already using MarketVibe to source early-stage deals.</p>
                <button
                    onClick={() => document.getElementById('investor-cta').scrollIntoView({ behavior: 'smooth' })}
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', padding: '16px 36px', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 30px rgba(245,158,11,0.3)' }}
                >
                    Get Investor Access — $299/mo →
                </button>
                <div style={{ marginTop: '1rem', color: '#475569', fontSize: '0.8rem' }}>First 10 spots: $199/mo · No lock-in</div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};

export default InvestorLanding;
