import React, { useState, useEffect } from 'react';

const LaunchpadListing = ({ listingId, onBack, supabase }) => {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListing = async () => {
            if (!listingId) return;
            const { data, error } = await supabase
                .from('launchpad_listings')
                .select('*')
                .eq('id', listingId)
                .single();

            if (data) setListing(data);
            setLoading(false);
        };
        fetchListing();
    }, [listingId]);

    if (loading) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (!listing) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Listing not found.</div>;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            padding: '2rem'
        }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '1rem' }}>← Back to Directory</button>

            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem'
                    }}>
                        {listing.name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>{listing.name}</h1>
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8', margin: 0 }}>{listing.tagline}</p>
                    </div>
                </div>

                <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem' }}>
                    <span style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>{listing.niche}</span>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>💰 {listing.revenue_potential || 'Undisclosed'}</span>
                </div>

                <div style={{ lineHeight: '1.6', color: '#cbd5e1', fontSize: '1.05rem' }}>
                    {listing.description}
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => window.open(listing.url, '_blank')}
                        style={{
                            background: '#6366f1', color: 'white', border: 'none', padding: '12px 24px',
                            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
                        }}
                    >
                        Visit Website ↗
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LaunchpadListing;
