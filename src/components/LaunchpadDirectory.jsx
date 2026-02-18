import React, { useState, useEffect } from 'react';
import LaunchpadCard from './LaunchpadCard';

/**
 * 🚀 MarketVibe Launchpad — Product Directory
 * A ProductHunt-style listing page for validated startup ideas.
 */
const LaunchpadDirectory = ({ supabase }) => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('trending'); // trending, newest, top

    const categories = ['All', 'SaaS', 'AI', 'FinTech', 'E-commerce', 'Health', 'Education', 'Marketing', 'Developer Tools'];

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const { data, error } = await supabase
                .from('launchpad_listings')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setListings(data);
            }
        } catch (err) {
            console.error('Error fetching listings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async (listingId) => {
        // Optimistic update
        setListings(prev => prev.map(l =>
            l.id === listingId ? { ...l, upvotes: l.upvotes + 1 } : l
        ));

        try {
            await supabase.rpc('increment_upvotes', { listing_id: listingId });
        } catch (err) {
            console.error('Upvote error:', err);
        }
    };

    // Filter and sort
    let displayed = listings.filter(l => {
        const matchesFilter = activeFilter === 'All' || l.niche === activeFilter;
        const matchesSearch = !searchQuery ||
            l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.tagline.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Sort
    if (sortBy === 'trending') {
        // Featured/validated first, then by upvotes
        displayed.sort((a, b) => {
            const tierOrder = { validated: 0, featured: 1, free: 2 };
            const tierDiff = (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
            if (tierDiff !== 0) return tierDiff;
            return b.upvotes - a.upvotes;
        });
    } else if (sortBy === 'newest') {
        displayed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'top') {
        displayed.sort((a, b) => b.upvotes - a.upvotes);
    }

    const featuredCount = listings.filter(l => l.tier === 'featured' || l.tier === 'validated').length;
    const totalUpvotes = listings.reduce((sum, l) => sum + l.upvotes, 0);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)',
            color: '#fff',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            {/* Hero */}
            <div style={{
                padding: '3rem 2rem 2rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Gradient orbs */}
                <div style={{
                    position: 'absolute', top: '-100px', left: '20%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', top: '-50px', right: '15%', width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '20px',
                        padding: '5px 16px',
                        fontSize: '0.8rem',
                        color: '#a5b4fc',
                        marginBottom: '1rem',
                        fontWeight: 600,
                    }}>🚀 MarketVibe Launchpad</div>

                    <h1 style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                        fontWeight: 900,
                        margin: '0 0 0.75rem',
                        lineHeight: 1.15,
                    }}>
                        Discover the Next Big{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Startup Ideas</span>
                    </h1>

                    <p style={{
                        color: '#94a3b8',
                        fontSize: '1.05rem',
                        maxWidth: '550px',
                        margin: '0 auto 1.5rem',
                        lineHeight: 1.6,
                    }}>
                        Community-curated directory of validated startup ideas. Upvote your favorites, get inspired, or submit your own.
                    </p>

                    {/* Stats bar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '2rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                    }}>
                        {[
                            { label: 'Products', value: listings.length, icon: '📦' },
                            { label: 'Upvotes', value: totalUpvotes, icon: '🔥' },
                            { label: 'Featured', value: featuredCount, icon: '⭐' },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                                    {stat.icon} {stat.value}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit CTA */}
                    <a
                        href="/launchpad/submit"
                        style={{
                            display: 'inline-block',
                            padding: '12px 28px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            transition: 'all 0.25s ease',
                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
                        }}
                    >
                        Submit Your Idea →
                    </a>
                </div>
            </div>

            {/* Search + Filters */}
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '0 1.5rem 1rem',
            }}>
                {/* Search */}
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search products..."
                        style={{
                            width: '100%',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Categories + Sort */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '0.4rem',
                        flexWrap: 'wrap',
                    }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: activeFilter === cat
                                        ? '1px solid rgba(99, 102, 241, 0.5)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                    background: activeFilter === cat
                                        ? 'rgba(99, 102, 241, 0.15)'
                                        : 'rgba(255,255,255,0.03)',
                                    color: activeFilter === cat ? '#a5b4fc' : '#94a3b8',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >{cat}</button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {['trending', 'newest', 'top'].map(sort => (
                            <button
                                key={sort}
                                onClick={() => setSortBy(sort)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: sortBy === sort ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    color: sortBy === sort ? '#a5b4fc' : '#64748b',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                }}
                            >{sort === 'trending' ? '🔥 ' : sort === 'newest' ? '🆕 ' : '🏆 '}{sort}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Listings */}
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '0 1.5rem 3rem',
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'spin 1s linear infinite' }}>🔄</div>
                        Loading listings...
                    </div>
                ) : displayed.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>
                            {searchQuery || activeFilter !== 'All'
                                ? 'No products match your search'
                                : 'Be the first to launch!'}
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                            Submit your validated idea and get discovered by the community.
                        </p>
                        <a
                            href="/launchpad/submit"
                            style={{
                                display: 'inline-block',
                                padding: '10px 24px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: '#fff',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                            }}
                        >Submit Your Idea →</a>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Today's header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0',
                            marginTop: '0.5rem',
                        }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>
                                🏆 TODAY'S TOP LAUNCHES
                            </span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                            <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                                {displayed.length} product{displayed.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {displayed.map(listing => (
                            <LaunchpadCard
                                key={listing.id}
                                listing={listing}
                                onUpvote={handleUpvote}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            <div style={{
                textAlign: 'center',
                padding: '2rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
                <p style={{ color: '#64748b', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    Have a validated idea? Get it in front of thousands of founders.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <a href="/launchpad/submit" style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                    }}>Submit Free →</a>
                    <a href="/launchpad/submit?tier=featured" style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                    }}>⭐ Get Featured — $29</a>
                    <a href="/launchpad/submit?tier=validated" style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                        color: '#fff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                    }}>✓ Get Verified — $99</a>
                </div>
            </div>
        </div>
    );
};

export default LaunchpadDirectory;
