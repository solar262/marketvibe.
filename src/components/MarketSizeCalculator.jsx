import React, { useState } from 'react';

const MarketSizeCalculator = () => {
    const [tam, setTam] = useState(1000000);
    const [sam, setSam] = useState(100000);
    const [som, setSom] = useState(10000);

    return (
        <div style={{ padding: '6rem 2rem', background: '#020617', color: 'white' }}>
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
                    <button style={{
                        marginTop: '1.5rem',
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
    );
};

export default MarketSizeCalculator;
