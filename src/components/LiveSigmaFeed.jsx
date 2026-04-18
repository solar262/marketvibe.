import React, { useState, useEffect } from 'react';

const LiveSigmaFeed = () => {
    const [signals, setSignals] = useState([
        { id: 1, type: 'DETECTED', text: "'AI Cybersecurity' heat score spikes to 94", time: 'Just now' },
        { id: 2, type: 'UP', text: "'Micro-Carbon Credit' volume +12%", time: '2m ago' },
        { id: 3, type: 'ALERT', text: "'Personalized Nutrition' signals detected in UK", time: '5m ago' },
        { id: 4, type: 'TREND', text: "'AR Industrial Training' Enterprise adoption rising", time: '12m ago' }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            const types = ['DETECTED', 'UP', 'ALERT', 'TREND', 'LEAD'];
            const niches = ['EdTech', 'FinTech', 'GovTech', 'SaaS', 'BioTech', 'Logistics'];
            const type = types[Math.floor(Math.random() * types.length)];
            const niche = niches[Math.floor(Math.random() * niches.length)];
            
            const newSignal = {
                id: Date.now(),
                type,
                text: `'${niche}' intelligence scanning active`,
                time: 'Just now'
            };
            
            setSignals(prev => [newSignal, ...prev.slice(0, 3)]);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const getTypeColor = (type) => {
        switch (type) {
            case 'DETECTED': return '#ec4899';
            case 'ALERT': return '#f59e0b';
            case 'UP': return '#10b981';
            default: return '#3b82f6';
        }
    };

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '3rem',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 12px #10b981', animation: 'pulse 2s infinite' }}></div>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.1em', color: '#94a3b8' }}>LIVE SIGMA SCANNER</span>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {signals.map(signal => (
                    <div key={signal.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 900, 
                                color: getTypeColor(signal.type),
                                background: 'rgba(255,255,255,0.03)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${getTypeColor(signal.type)}22`
                            }}>[{signal.type}]</span>
                            <span style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 500 }}>{signal.text}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{signal.time}</span>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(0.95); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LiveSigmaFeed;
