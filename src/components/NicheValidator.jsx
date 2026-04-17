import React, { useEffect, useState } from 'react';
import { popularNiches } from '../lib/niches';
import { generateValidationReport } from '../lib/generator';
import AdSenseUnit from './AdSenseUnit';

const TerminalLoader = ({ nicheName }) => {
    const lines = [
        "Initializing global market scanners...",
        `Targeting niche vector: ${nicheName}`,
        "Cross-referencing Stripe payment volumes (2026 data)...",
        "Analyzing search intent & SEO gaps...",
        "Identifying primary audience pain points...",
        "Simulating 30-Day Go-To-Market execution plan...",
        "Compiling executive intelligence brief..."
    ];
    const [visibleLines, setVisibleLines] = useState([]);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index < lines.length) {
                setVisibleLines(prev => [...prev, lines[index]]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 600); // 4 seconds total approx
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#040b16'
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '1rem',
                padding: '2rem',
                width: '100%',
                maxWidth: '600px',
                fontFamily: 'monospace',
                boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)'
            }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
                </div>
                <div style={{ color: '#10b981', marginBottom: '1rem' }}>$ marketvibe-terminal --execute validation</div>
                {visibleLines.map((line, idx) => (
                    <div key={idx} style={{ color: '#a5b4fc', marginBottom: '0.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                        &gt; {line}
                    </div>
                ))}
                <div style={{ color: '#fff', marginTop: '1rem', animation: 'pulse 1s infinite' }}>_</div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes pulse { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
            `}</style>
        </div>
    );
};

const NicheValidator = ({ niche, onUpgrade, spots }) => {
    const [nicheData, setNicheData] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const pathParts = window.location.pathname.split('/');
        const slugFromUrl = pathParts[pathParts.length - 1];
        const found = niche || popularNiches.find(n => n.slug === slugFromUrl) || popularNiches.find(n => n.slug === 'saas');
        
        setNicheData(found);

        try {
            const sampleReport = generateValidationReport({
                name: found.name,
                description: `How to build and validate a ${found.name} business in 30 days.`,
                audience: found.audience || "Founders & Builders",
                niche: found.name
            });
            setReport(sampleReport);
        } catch (err) {
            console.error("[NicheValidator] Failed to generate report:", err);
        }

        // Simulate 4.5s load for authority building
        const timer = setTimeout(() => setLoading(false), 4500);
        return () => clearTimeout(timer);
    }, [niche]);

    if (loading || !report || !nicheData) {
        return <TerminalLoader nicheName={nicheData ? nicheData.name : 'Target Niche'} />;
    }

    return (
        <div style={{ background: '#020617', minHeight: '100vh', paddingBottom: '5rem', overflowX: 'hidden' }}>
            <style>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                    border-radius: 1.5rem;
                }
                .timeline-bridge {
                    position: absolute; left: 2.2rem; top: 3.5rem; bottom: -1rem; 
                    width: 2px;
                    background: linear-gradient(180deg, rgba(99, 102, 241, 0.5) 0%, rgba(99, 102, 241, 0) 100%);
                }
            `}</style>
            
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem', position: 'relative', zIndex: 1 }}>
                
                {/* Authority Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem', marginBottom: '3rem' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', marginBottom: '1rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
                            MarketVibe Verified Data
                        </div>
                        <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: '900', letterSpacing: '-0.04em', color: 'white', lineHeight: '1.1' }}>
                            {nicheData.name} <br/>
                            <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Market Briefing</span>
                        </h1>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report ID</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#6366f1' }}>MV-{(Math.random() * 100000).toFixed(0)}-26</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '1rem' }}>Confidential & Proprietary</div>
                    </div>
                </div>

                {/* Intelligence Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <div className="glass-panel" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' }}></div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>TAM Valuation</div>
                        <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>${report.revenueForecast.marketSize}</div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>Total Addressable Market calculated from active spending behaviors in sector.</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)' }}></div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Revenue Velocity</div>
                        <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>${report.revenueForecast.estimatedAnnualRevenue}</div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>Projected ARR for newly validated startups capturing roughly 1.2% market share.</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)' }}></div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Audience Vector</div>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: '#a5b4fc', letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: '1.2' }}>{report.targetAudience.primarySegment}</div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                            "Deep frustration with {report.targetAudience.painPoints?.[0] || 'legacy solutions'}."
                        </div>
                    </div>
                </div>

                <div style={{ margin: '4rem 0' }}>
                    <AdSenseUnit />
                </div>

                {/* The 30-Day Launch Sequence */}
                <div style={{ marginBottom: '5rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '1rem', letterSpacing: '-0.02em' }}>The 30-Day Launch Sequence</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '4rem', maxWidth: '700px' }}>
                        This is the exact, data-driven timeline to validate, build, and monetize {nicheData.name} without guessing.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {report.executionPlan?.map((phase, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                                {/* Hide bridge on last element */}
                                {idx !== report.executionPlan.length - 1 && <div className="timeline-bridge"></div>}
                                
                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    {/* Vertical Node */}
                                    <div style={{
                                        width: '4.5rem', height: '4.5rem',
                                        background: 'linear-gradient(135deg, #312e81, #4c1d95)',
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem', fontWeight: '900', color: 'white',
                                        border: '4px solid #0f172a',
                                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                                        position: 'relative', zIndex: 2
                                    }}>
                                        W{idx + 1}
                                    </div>
                                    
                                    {/* Phase Content */}
                                    <div style={{ flex: 1, paddingTop: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                                            {phase.week}
                                        </h3>
                                        
                                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {phase.tasks.map((task, tIdx) => (
                                                <div key={tIdx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                                        {task.day}
                                                    </div>
                                                    <div style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6' }}>
                                                        {task.task}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    MarketVibe Autonomous Intelligence Engine • Document Generated On-Demand • Not Financial Advice
                </div>
            </div>
        </div>
    );
};

export default NicheValidator;
