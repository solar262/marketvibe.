import React, { useState, useEffect } from 'react';

/**
 * 🏦 InvestorDashboard — Private feed for paying investors.
 * Shows full listing details, filters, and "Express Interest" functionality.
 */
const InvestorDashboard = ({ supabase }) => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortBy, setSortBy] = useState('score');
    const [interestSent, setInterestSent] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', 'SaaS', 'AI', 'FinTech', 'E-commerce', 'Health', 'Education', 'Marketing', 'Developer Tools'];

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        if (!supabase) { setLoading(false); return; }
        try {
            const { data } = await supabase
                .from('launchpad_listings')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });
            if (data) setListings(data);
        } catch (err) {
            console.error('Investor dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExpressInterest = async (listing) => {
        setInterestSent(prev => ({ ...prev, [listing.id]: true }));
        // Log interest in Supabase
        if (supabase) {
            await supabase.from('investor_interest').insert({
                listing_id: listing.id,
                listing_name: listing.name,
                founder_email: listing.founder_email || null,
                expressed_at: new Date().toISOString(),
            }).catch(() => { });
        }
        // In production: send email to founder
        alert(`✅ Interest expressed in "${listing.name}"! The founder will be notified.`);
    };

    let displayed = listings.filter(l => {
        const matchesFilter = activeFilter === 'All' || l.niche === activeFilter;
        const matchesSearch = !searchQuery ||
            l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.tagline?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (sortBy === 'score') {
        displayed.sort((a, b) => {
            const tierOrder = { validated: 0, featured: 1, free: 2 };
            return (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
        });
    } else if (sortBy === 'upvotes') {
        displayed.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortBy === 'newest') {
        displayed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const nicheColors = {
        'SaaS': '#6366f1', 'AI': '#a855f7', 'FinTech': '#10b981',
        'E-commerce': '#f59e0b', 'Health': '#ef4444', 'Education': '#3b82f6',
        'Marketing': '#ec4899', 'Developer Tools': '#14b8a6',
    };

    const tierBadge = (tier) => {
        if (tier === 'validated') return { label: '✓ VERIFIED', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
        if (tier === 'featured') return { label: '⭐ FEATURED', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
        return null;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)',
            color: '#fff',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>🏦</span>
                        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Investor Deal Flow</h1>
                        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>PRIVATE ACCESS</span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                        {listings.length} validated ideas · Updated every 24h · Express interest to contact founders directly
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['score', 'upvotes', 'newest'].map(s => (
                        <button key={s} onClick={() => setSortBy(s)} style={{
                            padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize',
                            background: sortBy === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                            color: sortBy === s ? '#f59e0b' : '#64748b',
                        }}>
                            {s === 'score' ? '🏆 Top Validated' : s === 'upvotes' ? '🔥 Most Upvoted' : '🆕 Newest'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 2rem' }}>
                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search deals..."
                        style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveFilter(cat)} style={{
                                padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                border: activeFilter === cat ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                background: activeFilter === cat ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                                color: activeFilter === cat ? '#f59e0b' : '#94a3b8',
                            }}>{cat}</button>
                        ))}
                    </div>
                </div>

                {/* Listings */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading deal flow...</div>
                ) : displayed.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>No listings match your filters.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {displayed.map((listing, i) => {
                            const badge = tierBadge(listing.tier);
                            const nicheColor = nicheColors[listing.niche] || '#6366f1';
                            const alreadyInterested = interestSent[listing.id];

                            return (
                                <div key={listing.id} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: listing.tier === 'validated' ? '1px solid rgba(168,85,247,0.25)' : listing.tier === 'featured' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '16px', padding: '1.5rem',
                                    boxShadow: listing.tier === 'validated' ? '0 0 20px rgba(168,85,247,0.08)' : 'none',
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                        {/* Rank */}
                                        <div style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 700, minWidth: '24px', paddingTop: '2px' }}>#{i + 1}</div>

                                        {/* Icon */}
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `linear-gradient(135deg, ${nicheColor}44, ${nicheColor}22)`, border: `1px solid ${nicheColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                                            {listing.name?.charAt(0) || '🚀'}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{listing.name}</span>
                                                {badge && (
                                                    <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>{badge.label}</span>
                                                )}
                                            </div>
                                            <p style={{ margin: '0 0 0.75rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>{listing.tagline}</p>

                                            {/* Full description — investor-only */}
                                            {listing.description && (
                                                <p style={{ margin: '0 0 0.75rem', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6, borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: '0.75rem' }}>
                                                    {listing.description}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {listing.niche && <span style={{ background: `${nicheColor}22`, color: nicheColor, padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>{listing.niche}</span>}
                                                {listing.revenue_potential && <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>💰 {listing.revenue_potential}</span>}
                                                <span style={{ color: '#475569', fontSize: '0.75rem' }}>▲ {listing.upvotes || 0} upvotes</span>
                                                {listing.founder_name && <span style={{ color: '#475569', fontSize: '0.75rem' }}>by {listing.founder_name}</span>}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                                            <button
                                                onClick={() => handleExpressInterest(listing)}
                                                disabled={alreadyInterested}
                                                style={{
                                                    padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: alreadyInterested ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                                                    background: alreadyInterested ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                    color: alreadyInterested ? '#10b981' : '#000',
                                                }}
                                            >
                                                {alreadyInterested ? '✅ Interest Sent' : '⚡ Express Interest'}
                                            </button>
                                            {listing.url && (
                                                <button
                                                    onClick={() => window.open(listing.url, '_blank')}
                                                    style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                                                >
                                                    Visit Site ↗
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvestorDashboard;
