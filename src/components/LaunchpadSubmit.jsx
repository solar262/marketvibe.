import React, { useState, useEffect } from 'react';

/**
 * 🚀 LaunchpadSubmit — Submission form for new product listings
 * Supports free, featured ($29), and validated ($99) tiers.
 */
const LaunchpadSubmit = ({ supabase }) => {
    const [formData, setFormData] = useState({
        name: '',
        tagline: '',
        description: '',
        niche: 'SaaS',
        url: '',
        logo_url: '',
        founder_email: '',
        founder_name: '',
    });
    const [tier, setTier] = useState('free');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const categories = ['SaaS', 'AI', 'FinTech', 'E-commerce', 'Health', 'Education', 'Marketing', 'Developer Tools'];

    useEffect(() => {
        // Check URL for pre-selected tier
        const params = new URLSearchParams(window.location.search);
        const urlTier = params.get('tier');
        const status = params.get('status');

        if (urlTier && ['free', 'featured', 'validated'].includes(urlTier)) {
            setTier(urlTier);
        }

        // Handle Stripe Return
        if (status === 'success') {
            const handleReturn = async () => {
                const pendingId = localStorage.getItem('lp_pending_id');
                if (pendingId) {
                    setSubmitting(true);
                    try {
                        const { error } = await supabase
                            .from('launchpad_listings')
                            .update({ status: 'approved' })
                            .eq('id', pendingId);

                        if (error) throw error;

                        localStorage.removeItem('lp_pending_id');
                        localStorage.removeItem('lp_pending_submission'); // Cleanup legacy if exists
                        setSubmitted(true);
                    } catch (err) {
                        console.error('Error activating listing:', err);
                        setError('Payment received, but we failed to activate your listing. Please contact support.');
                    } finally {
                        setSubmitting(false);
                    }
                }
            };
            handleReturn();
        }
    }, []);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) return setError('Product name is required');
        if (!formData.tagline.trim()) return setError('Tagline is required');
        if (!formData.founder_email.trim() || !formData.founder_email.includes('@')) {
            return setError('Valid email is required');
        }

        setSubmitting(true);

        const submissionPayload = {
            ...formData,
            description: formData.logo_url
                ? `${formData.description}\n\n||metadata:logo=${formData.logo_url}||`
                : formData.description
        };
        // Remove logo_url from payload as it's not a real column
        delete submissionPayload.logo_url;

        try {
            // For paid tiers, redirect to Stripe first
            if (tier === 'featured' || tier === 'validated') {
                localStorage.setItem('lp_pending_submission', JSON.stringify({ ...submissionPayload, tier }));

                const stripeLinks = {
                    featured: `https://buy.stripe.com/test_featured?prefilled_email=${encodeURIComponent(formData.founder_email)}`,
                    validated: `https://buy.stripe.com/test_validated?prefilled_email=${encodeURIComponent(formData.founder_email)}`,
                };

                const { data, error: dbError } = await supabase
                    .from('launchpad_listings')
                    .insert({
                        ...submissionPayload,
                        tier,
                        status: 'pending',
                        upvotes: tier === 'featured' ? 5 : 10,
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;
                if (data?.id) localStorage.setItem('lp_pending_id', data.id);
                window.location.href = stripeLinks[tier];
                return;
            }

            // Free submission
            const { error: dbError } = await supabase
                .from('launchpad_listings')
                .insert({
                    ...submissionPayload,
                    tier: 'free',
                    status: 'approved',
                    upvotes: 0,
                });

            if (dbError) throw dbError;
            setSubmitted(true);
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const tierOptions = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            description: 'Standard listing in the directory',
            features: ['Listed in directory', 'Upvote enabled', 'Niche categorized'],
            color: '#64748b',
            bgGradient: 'rgba(255,255,255,0.03)',
        },
        {
            id: 'featured',
            name: 'Featured',
            price: '$29',
            description: 'Pinned to top with gold badge for 7 days',
            features: ['⭐ Gold FEATURED badge', '📌 Pinned to top', '+5 starting upvotes', '7-day boost'],
            color: '#f59e0b',
            bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))',
            popular: true,
        },
        {
            id: 'validated',
            name: 'Verified',
            price: '$99',
            description: 'Full MarketVibe validation + permanent verified badge',
            features: ['✓ Purple VERIFIED badge', '📊 Full validation report', '+10 starting upvotes', 'Permanent listing', 'Revenue forecast included'],
            color: '#a855f7',
            bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(124,58,237,0.04))',
        },
    ];

    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{
                    textAlign: 'center',
                    maxWidth: '450px',
                    padding: '3rem 2rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                        You're Live on the Launchpad!
                    </h2>
                    <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                        <strong style={{ color: '#fff' }}>{formData.name}</strong> is now listed in the MarketVibe Launchpad.
                        {tier !== 'free' && ` Your ${tier === 'featured' ? '⭐ Featured' : '✓ Verified'} badge is active!`}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/launchpad" style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            color: '#fff',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                        }}>View in Directory →</a>
                        <a href="/" style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#94a3b8',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                        }}>Back to MarketVibe</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)',
            fontFamily: "'Inter', sans-serif",
            color: '#fff',
        }}>
            {/* Header */}
            <div style={{ padding: '2rem 2rem 1rem', textAlign: 'center' }}>
                <a href="/launchpad" style={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                }}>← Back to Launchpad</a>

                <h1 style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                    fontWeight: 900,
                    margin: '1rem 0 0.5rem',
                }}>
                    Submit Your{' '}
                    <span style={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Startup Idea</span>
                </h1>
                <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
                    Get your validated idea in front of thousands of founders and investors.
                </p>
            </div>

            <div style={{
                maxWidth: '700px',
                margin: '0 auto',
                padding: '1rem 1.5rem 3rem',
            }}>
                {/* Tier Selection */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>Choose Your Listing Tier</label>

                    {/* Trust/Value Prop (FOMO/Optimization) */}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(99, 102, 241, 0.05)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem' }}>💡</div>
                        <div style={{ fontSize: '0.8rem', color: '#a5b4fc', lineHeight: 1.5 }}>
                            Historically, <b>Verified listings</b> receive <b>4.5x more upvotes</b> and are <b>12x more likely</b> to be contacted by our automated High-Ticket Sales Agent.
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.75rem',
                    }}>
                        {tierOptions.map(option => (
                            <div
                                key={option.id}
                                onClick={() => setTier(option.id)}
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: '14px',
                                    border: tier === option.id
                                        ? `2px solid ${option.color}`
                                        : '1px solid rgba(255,255,255,0.08)',
                                    background: tier === option.id ? option.bgGradient : 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    position: 'relative',
                                }}
                            >
                                {option.popular && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '12px',
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        padding: '2px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                    }}>POPULAR</div>
                                )}

                                <div style={{
                                    fontSize: '1.3rem',
                                    fontWeight: 900,
                                    color: option.color,
                                    marginBottom: '4px',
                                }}>{option.price}</div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: '#fff',
                                    marginBottom: '4px',
                                }}>{option.name}</div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    marginBottom: '0.75rem',
                                    lineHeight: 1.4,
                                }}>{option.description}</div>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                }}>
                                    {option.features.map((f, i) => (
                                        <li key={i} style={{
                                            fontSize: '0.72rem',
                                            color: '#94a3b8',
                                            padding: '2px 0',
                                        }}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Product Name */}
                        <div>
                            <label style={labelStyle}>Product Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g. MarketVibe, InvoiceFlow, ContentAI"
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Tagline */}
                        <div>
                            <label style={labelStyle}>Tagline *</label>
                            <input
                                type="text"
                                value={formData.tagline}
                                onChange={(e) => handleChange('tagline', e.target.value)}
                                placeholder="One-liner that describes your product"
                                required
                                maxLength={120}
                                style={inputStyle}
                            />
                            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>
                                {formData.tagline.length}/120
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Tell us more about your product, the problem it solves, and your target market..."
                                rows={4}
                                style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                            />
                        </div>

                        {/* Two-column: Category + Product URL */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Category *</label>
                                <select
                                    value={formData.niche}
                                    onChange={(e) => handleChange('niche', e.target.value)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Product Website</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => handleChange('url', e.target.value)}
                                    placeholder="https://yourproduct.com"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Logo URL */}
                        <div>
                            <label style={labelStyle}>Logo Image URL</label>
                            <input
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => handleChange('logo_url', e.target.value)}
                                placeholder="Paste a link to your logo (or leave blank for AI icon)"
                                style={inputStyle}
                            />
                            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>
                                Pro tip: Host your logo on Imgur, PostImages, or your own CDN.
                            </div>
                        </div>

                        {/* Two-column: Name + Email */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Your Name</label>
                                <input
                                    type="text"
                                    value={formData.founder_name}
                                    onChange={(e) => handleChange('founder_name', e.target.value)}
                                    placeholder="Jane Doe"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email *</label>
                                <input
                                    type="email"
                                    value={formData.founder_email}
                                    onChange={(e) => handleChange('founder_email', e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                fontSize: '0.85rem',
                            }}>{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '14px',
                                borderRadius: '12px',
                                border: 'none',
                                background: tier === 'featured'
                                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                    : tier === 'validated'
                                        ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                        : 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: submitting ? 'wait' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                                transition: 'all 0.25s ease',
                            }}
                        >
                            {submitting
                                ? 'Submitting...'
                                : tier === 'free'
                                    ? '🚀 Submit for Free'
                                    : tier === 'featured'
                                        ? '⭐ Submit & Pay $29'
                                        : '✓ Submit & Pay $99'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Shared styles
const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
};

export default LaunchpadSubmit;
