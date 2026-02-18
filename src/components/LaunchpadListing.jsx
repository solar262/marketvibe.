import React, { useState, useEffect } from 'react';

const LaunchpadListing = ({ listingId, onBack, supabase }) => {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!supabase) {
            console.error("Supabase client missing in LaunchpadListing");
            setError("System Error: Database connection failed.");
            setLoading(false);
            return;
        }

        const fetchListing = async () => {
            if (!listingId) {
                // If ID is missing, we can't load anything.
                setLoading(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('launchpad_listings')
                    .select('*')
                    .eq('id', listingId)
                    .single();

                if (error) throw error;
                if (data) setListing(data);
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Could not load listing.");
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [listingId, supabase]);

    if (loading) return <div style={{ color: '#94a3b8', padding: '4rem', textAlign: 'center' }}>Loading listing details...</div>;

    if (error) return (
        <div style={{ color: '#ef4444', padding: '4rem', textAlign: 'center' }}>
            <h3>⚠️ Error</h3>
            <p>{error}</p>
            <button onClick={onBack} style={{ marginTop: '1rem', background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
        </div>
    );

    if (!listing) return (
        <div style={{ color: 'white', padding: '4rem', textAlign: 'center' }}>
            <h3>Listing not found</h3>
            <button onClick={onBack} style={{ marginTop: '1rem', background: '#6366f1', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Back to Directory</button>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            padding: '2rem'
        }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '1rem', fontSize: '1rem' }}>← Back to Directory</button>

            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
                        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
                    }}>
                        {listing.name ? listing.name.charAt(0) : '🚀'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {listing.name}
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{listing.tagline}</p>
                    </div>
                </div>

                <div style={{ margin: '2rem 0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {listing.niche && <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid rgba(99,102,241,0.2)' }}>{listing.niche}</span>}
                    {listing.revenue_potential && <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>💰 {listing.revenue_potential}</span>}
                    {listing.tier === 'featured' && <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>⭐ Featured</span>}
                </div>

                <div style={{ lineHeight: '1.8', color: '#cbd5e1', fontSize: '1.1rem', whiteSpace: 'pre-line' }}>
                    {listing.description}
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                    {listing.url && (
                        <button
                            onClick={() => window.open(listing.url, '_blank')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', padding: '14px 28px',
                                borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            Visit Website ↗
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LaunchpadListing;
