import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const CaseStudyHub = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCases = async () => {
            const { data } = await supabase
                .from('leads')
                .select('*')
                .eq('status', 'completed_validation')
                .not('results', 'is', null)
                .order('created_at', { ascending: false })
                .limit(12);

            setCases(data || []);
            setLoading(false);
        };
        fetchCases();
    }, []);

    if (loading) return null;

    return (
        <div style={{ padding: '6rem 2rem', background: '#020617', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: '900' }}>The <span style={{ color: '#6366f1' }}>Hall of Fame</span></h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                        Real ideas, real data. Explore how founders are using MarketVibe to validate their next move.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {cases.map((c, idx) => (
                        <div key={idx} style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '1.5rem',
                            padding: '2rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'transform 0.2s'
                        }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{
                                    padding: '0.4rem 0.8rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '0.5rem',
                                    color: '#818cf8',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                }}>
                                    {c.results?.niche || 'Niche Found'}
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#6366f1' }}>
                                    {c.results?.overallScore}/10
                                </div>
                            </div>
                            <h3 style={{ marginBottom: '1rem' }}>{c.project_name || 'Anonymous Project'}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                                {c.project_description?.substring(0, 120)}...
                            </p>
                            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                    Revenue Potential: <span style={{ color: '#10b981' }}>${c.results?.revenueForecast?.estimatedAnnualRevenue}</span>
                                </div>
                                <button style={{
                                    background: 'transparent',
                                    border: '1px solid #6366f1',
                                    color: '#6366f1',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}>
                                    View Logic
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CaseStudyHub;
