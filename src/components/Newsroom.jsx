import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const Newsroom = () => {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            const { data } = await supabase
                .from('trending_niches')
                .select('*')
                .order('growth_score', { ascending: false });

            if (data) setTrends(data);
            setLoading(false);
        };
        fetchTrends();
    }, []);

    if (loading) return <div style={{ color: '#94a3b8', padding: '4rem', textAlign: 'center' }}>🛰️ Scanning for Breakout Trends...</div>;

    return (
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div className="badge" style={{ background: '#ef4444', color: 'white' }}>LIVE: TRENDING NOW</div>
                <h2 style={{ fontSize: '2.5rem', marginTop: '1rem' }}>The MarketVibe Newsroom 📰</h2>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Breakout niches identified by AI momentum tracking. Be the first to market.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {trends.map(trend => (
                    <div key={trend.id} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '1.5rem',
                        padding: '2rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {trend.is_breakout && (
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: '#ef4444',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '2rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>🔥 BREAKOUT</div>
                        )}

                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#6366f1' }}>{trend.niche}</h3>

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase' }}>Momentum</div>
                                <div style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 'bold' }}>{trend.growth_score}%</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase' }}>Signals</div>
                                <div style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>{trend.lead_count}</div>
                            </div>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                            {trend.summary}
                        </p>

                        <button
                            onClick={() => window.location.href = `/validate/${trend.niche.toLowerCase().replace(/ /g, '-')}`}
                            className="btn-primary"
                            style={{ width: '100%', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1', color: '#6366f1' }}
                        >
                            Claim this Niche 🚀
                        </button>
                    </div>
                ))}
            </div>

            {trends.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
                    <p style={{ color: '#475569' }}>The newsroom is currently silent. Check back in a few hours as our agents scan for the next big thing.</p>
                </div>
            )}
        </div>
    );
};

export default Newsroom;
