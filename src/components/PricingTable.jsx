import React from 'react';

const PricingTable = ({ onSelectPlan, spots }) => {
    const plans = [
        {
            name: 'Basic',
            price: '$0',
            description: 'Perfect for quick brainstorming.',
            features: [
                'Instant Idea Validation',
                'Landing Page Copy Builder',
                'Basic Revenue Forecast',
                'Email Support'
            ],
            cta: 'Start Free Validation',
            recommended: false,
            action: () => onSelectPlan('free')
        },
        {
            name: 'Founder',
            price: '$49',
            period: 'One-time',
            description: 'Your complete launch & execution toolkit.',
            features: [
                'All Basic Features',
                'Niche-Specific 30-Day Interactive Roadmap',
                'Founder Asset Library (Outreach & Email)',
                'Priority Verification Badge',
                'Ready-to-Post Social Templates',
                'Lifetime Access + All Updates'
            ],
            cta: 'Secure My Founder Launch Kit',
            recommended: true,
            badge: `${spots} spots left`,
            action: () => onSelectPlan('pro')
        },
        {
            name: 'Expert',
            price: '$99',
            period: '/mo',
            description: 'For power users and agencies.',
            features: [
                'Unlimited Validations',
                'White-label PDF Reports',
                'Custom Branding',
                'Early Access to Tools',
                'Dedicated Success Manager'
            ],
            cta: 'Go Expert',
            recommended: false,
            action: () => onSelectPlan('expert')
        }
    ];

    return (
        <section style={{ padding: '6rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}> Simple, Transparent Pricing 💎</h2>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that fits your ambition. From first idea to first revenue.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {plans.map((plan, index) => (
                    <div key={index} style={{
                        background: plan.recommended ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)',
                        border: plan.recommended ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '1.5rem',
                        padding: '2.5rem',
                        position: 'relative',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        backdropFilter: 'blur(10px)',
                        boxShadow: plan.recommended ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(99, 102, 241, 0.1)' : 'none',
                        transform: plan.recommended ? 'scale(1.05)' : 'none',
                        zIndex: plan.recommended ? 2 : 1
                    }}>
                        {plan.badge && (
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                right: '2rem',
                                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                                color: 'white',
                                padding: '0.25rem 1rem',
                                borderRadius: '1rem',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                {plan.badge}
                            </div>
                        )}

                        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>{plan.name}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>{plan.description}</p>

                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '3rem', fontWeight: '800', color: 'white' }}>{plan.price}</span>
                            {plan.period && <span style={{ color: '#64748b', marginLeft: '0.5rem', fontSize: '1.1rem' }}>{plan.period}</span>}
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', flex: 1 }}>
                            {plan.features.map((feature, fIndex) => (
                                <li key={fIndex} style={{
                                    color: '#cbd5e1',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.95rem'
                                }}>
                                    <span style={{
                                        color: plan.recommended ? '#6366f1' : '#22c55e',
                                        marginRight: '0.75rem',
                                        fontSize: '1.2rem'
                                    }}>✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={plan.action}
                            style={{
                                background: plan.recommended ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                border: 'none',
                                padding: '1.25rem',
                                borderRadius: '1rem',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: plan.recommended ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                if (!plan.recommended) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                if (!plan.recommended) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                        >
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default React.memo(PricingTable);
