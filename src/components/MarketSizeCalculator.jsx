import React, { useState } from 'react';

const MarketSizeCalculator = () => {
    const [tam, setTam] = useState(1000000);
    const [sam, setSam] = useState(100000);
    const [som, setSom] = useState(10000);

    const [email, setEmail] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setShowModal(true);
        }, 45000); // 45s Nudge
        return () => clearTimeout(timer);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);

        const { supabase } = await import('../lib/supabase');

        await supabase.from('leads').upsert({
            email,
            niche: `TAM Calc: ${tam}`,
            status: 'tool_capture_tam',
            created_at: new Date().toISOString()
        }, { onConflict: 'email', ignoreDuplicates: true });

        setShowModal(false);
        setSubmitting(false);
        alert("Report captured! Check your inbox shortly.");
    };

    return (
        <div style={{ padding: '6rem 2rem', background: '#020617', color: 'white', position: 'relative' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>
                    Free <span style={{ color: '#10b981' }}>Market Size</span> Calculator
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '4rem', fontSize: '1.1rem' }}>
                    Calculate your TAM, SAM, and SOM in seconds. Capture investor attention with real numbers.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: '#64748b', marginBottom: '0.5rem' }}>TAM (Total Addressable)</h4>
                        <input
                            type="number"
                            value={tam}
                            onChange={(e) => setTam(parseInt(e.target.value))}
                            style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '1.5rem', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                        />
                        <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.5rem' }}>Total everyone who could use this.</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: '#64748b', marginBottom: '0.5rem' }}>SAM (Serviceable Addressable)</h4>
                        <input
                            type="number"
                            value={sam}
                            onChange={(e) => setSam(parseInt(e.target.value))}
                            style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                        />
                        <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.5rem' }}>The segment you can actually reach.</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: '#64748b', marginBottom: '0.5rem' }}>SOM (Serviceable Obtainable)</h4>
                        <input
                            type="number"
                            value={som}
                            onChange={(e) => setSom(parseInt(e.target.value))}
                            style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                        />
                        <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.5rem' }}>The realistic users you'll capture in Year 1.</p>
                    </div>
                </div>

                <div style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <h4 style={{ color: '#10b981' }}>💡 MarketVibe Analysis</h4>
                    <p style={{ fontSize: '1.2rem' }}>
                        Based on your SOM of <strong>{som.toLocaleString()} users</strong>, your Revenue Forecast is likely
                        <span style={{ color: '#10b981' }}> ${(som * 99).toLocaleString()} / year</span> (avg $99 LTV).
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                padding: '1rem 2rem',
                                borderRadius: '0.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                            📩 Email Me This Report
                        </button>
                        <button
                            onClick={onGetBlueprint}
                            style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '0.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                            Get Full 30-Day Validation Blueprint
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#0f172a', padding: '2rem', borderRadius: '1rem',
                        border: '1px solid #334155', maxWidth: '400px', width: '90%'
                    }}>
                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>📊 Save Your Market Data?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            We'll send you this breakdown plus a 30-day plan to capture that ${(som * 99).toLocaleString()} revenue.
                        </p>
                        <form onSubmit={handleSave}>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', marginBottom: '1rem',
                                    background: 'rgba(255,255,255,0.1)', border: '1px solid #475569',
                                    color: 'white', borderRadius: '0.5rem'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #475569', color: '#94a3b8', background: 'transparent', cursor: 'pointer' }}>Close</button>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{submitting ? 'Sending...' : 'Send Report'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketSizeCalculator;
