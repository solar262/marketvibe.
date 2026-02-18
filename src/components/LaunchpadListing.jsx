import React, { useState, useEffect } from 'react';

const LaunchpadListing = ({ listingId, onBack, supabase }) => {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        if (!supabase || !listingId) {
            setLoading(false);
            return;
        }
        const fetchListing = async () => {
            try {
                const { data, error } = await supabase
                    .from('launchpad_listings')
                    .select('*')
                    .eq('id', listingId)
                    .single();
                if (error) throw error;
                setListing(data);
            } catch (err) {
                setFetchError('Could not load this listing.');
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [listingId, supabase]);

    const containerStyle = {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '2rem',
    };

    if (loading) return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                Loading listing...
            </div>
        </div>
    );

    if (fetchError || !listing) return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>{fetchError || 'Listing not found'}</h3>
                <button onClick={onBack} style={{ marginTop: '1rem', background: '#6366f1', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ← Back to Directory
                </button>
            </div>
        </div>
    );

    const nicheColors = {
        'SaaS': '#6366f1', 'AI': '#a855f7', 'FinTech': '#10b981',
        'E-commerce': '#f59e0b', 'Health': '#ef4444', 'Education': '#3b82f6',
        'Marketing': '#ec4899', 'Developer Tools': '#14b8a6',
    };
    const nicheColor = nicheColors[listing.niche] || '#6366f1';

    const tierBadge = listing.tier === 'featured'
        ? { label: '⭐ FEATURED', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' }
        : listing.tier === 'validated'
            ? { label: '✓ VERIFIED', bg: 'linear-gradient(135deg, #a855f7, #7c3aed)' }
            : null;

    return (
        <div style={containerStyle}>
            {/* Back button */}
            <button
                onClick={onBack}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.95rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                ← Back to Directory
            </button>

            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                {/* Header card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Icon */}
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '18px', flexShrink: 0,
                            background: `linear-gradient(135deg, ${nicheColor}55, ${nicheColor}22)`,
                            border: `1px solid ${nicheColor}44`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 'bold', color: '#fff',
                        }}>
                            {listing.name ? listing.name.charAt(0).toUpperCase() : '🚀'}
                        </div>

                        {/* Title block */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{listing.name}</h1>
                                {tierBadge && (
                                    <span style={{ background: tierBadge.bg, padding: '3px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                                        {tierBadge.label}
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.5 }}>{listing.tagline}</p>
                        </div>
                    </div>

                    {/* Tags row */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                        {listing.niche && (
                            <span style={{ background: `${nicheColor}22`, color: nicheColor, padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: `1px solid ${nicheColor}33` }}>
                                {listing.niche}
                            </span>
                        )}
                        {listing.revenue_potential && (
                            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>
                                💰 {listing.revenue_potential}
                            </span>
                        )}
                        <span style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)' }}>
                            ▲ {listing.upvotes || 0} upvotes
                        </span>
                        {listing.founder_name && (
                            <span style={{ color: '#475569', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                                by {listing.founder_name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {listing.description && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem', color: '#e2e8f0', fontSize: '1rem', fontWeight: 700 }}>About this idea</h3>
                        <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-line' }}>{listing.description}</p>
                    </div>
                )}

                {/* CTA */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {listing.url && (
                        <button
                            onClick={() => window.open(listing.url, '_blank', 'noopener,noreferrer')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white',
                                border: 'none', padding: '14px 28px', borderRadius: '12px',
                                cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
                            }}
                        >
                            Visit Website ↗
                        </button>
                    )}
                    <button
                        onClick={onBack}
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
                    >
                        ← All Listings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LaunchpadListing;
