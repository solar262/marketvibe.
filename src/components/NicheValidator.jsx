import React, { useEffect, useState } from 'react';
import { popularNiches } from '../lib/niches';
import { generateValidationReport } from '../lib/generator';

const NicheValidator = () => {
    const [nicheData, setNicheData] = useState(null);
    const [report, setReport] = useState(null);

    useEffect(() => {
        const pathParts = window.location.pathname.split('/');
        const slugFromUrl = pathParts[pathParts.length - 1];
        const found = popularNiches.find(n => n.slug === slugFromUrl) || popularNiches.find(n => n.slug === 'saas');
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

        document.title = `Validate ${found.name} Startup Idea - MarketVibe`;
    }, []);

    if (!nicheData || !report) {
        return (
            <div style={{ padding: '10rem', textAlign: 'center', color: 'white' }}>
                <h2 style={{ color: '#6366f1' }}>📚 Initializing Validation Library...</h2>
                <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Preparing market data and revenue models.</p>
                <a href="/" style={{ color: '#6366f1', textDecoration: 'none', marginTop: '2rem', display: 'inline-block' }}>➜ Back to Dashboard</a>
            </div>
        );
    }

    return (
        <div style={{ padding: '4rem 1rem', maxWidth: '1000px', margin: '0 auto', color: 'white', position: 'relative' }}>
            {/* Header / Institutional Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px #6366f1' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Industry Report #{Math.floor(Math.random() * 9000) + 1000}
                    </span>
                </div>
                <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '2rem',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    ✓ Verified by MarketVibe AI
                </div>
            </div>

            {/* Main Hero Section */}
            <div style={{ marginBottom: '5rem' }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                    fontWeight: '900',
                    lineHeight: '1',
                    letterSpacing: '-0.03em',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(to right, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Validation Intelligence: <span style={{ color: '#6366f1', WebkitTextFillColor: 'initial' }}>{nicheData.name}</span>
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: '#94a3b8',
                    maxWidth: '700px',
                    lineHeight: '1.6',
                    marginBottom: '2.5rem'
                }}>
                    MarketVibe's autonomous engine has analyzed the {nicheData.name} niche across 50+ data signals.
                    This is your data-backed blueprint for market entry in 2026.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <a href="/" style={{
                        background: '#6366f1',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        textDecoration: 'none',
                        fontWeight: '800',
                        fontSize: '1rem',
                        boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)',
                        transition: 'transform 0.2s ease'
                    }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        Validate Custom Idea
                    </a>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#cbd5e1'
                    }}>
                        <span style={{ color: '#10b981' }}>🔥</span> High Entry Velocity
                    </div>
                </div>
            </div>

            {/* Executive Summary Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '5rem'
            }}>
                {/* Market Outlook Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📊</span>
                        <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '0.8rem' }}>MARKET CAP</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.5rem' }}>${report.revenueForecast.marketSize}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Total Addressable Market for {nicheData.name} startups with current velocity signals.
                    </p>
                </div>

                {/* Growth Potential Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🎯</span>
                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>TARGETING</span>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>{report.targetAudience.primarySegment}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Early adopters are currently over-indexed on <em>{report.targetAudience.painPoints?.[0] || 'Market Gaps'}</em>.
                    </p>
                </div>

                {/* Revenue Flow Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.8rem' }}>PROJECTED</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.5rem' }}>${report.revenueForecast.estimatedAnnualRevenue}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Potential Year 1 revenue based on a 1.2% capture rate for new {nicheData.name} entrants.
                    </p>
                </div>
            </div>

            {/* Content Body: The Blueprint */}
            <div style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
                padding: '4rem 2rem',
                borderRadius: '2rem',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>30-Day Execution Playbook</h2>
                    <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
                        Our AI has mapped the critical path for validating {nicheData.name} from Day 1 to Day 30.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '3rem', position: 'relative' }}>
                    {/* Vertical Line for Timeline */}
                    <div style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        bottom: '0',
                        width: '2px',
                        background: 'linear-gradient(to bottom, transparent, #6366f1, transparent)',
                        opacity: 0.3,
                        display: 'none' // Hidden on mobile, can be shown with media queries
                    }}></div>

                    {report.executionPlan?.map((phase, idx) => (
                        <div key={idx} style={{ position: 'relative', paddingLeft: '0' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{
                                    minWidth: '60px',
                                    height: '60px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    color: '#6366f1',
                                    fontWeight: '900'
                                }}>
                                    W{idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>
                                        {phase.week}
                                    </h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {phase.tasks.map((task, tIdx) => (
                                            <div key={tIdx} style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                padding: '1.25rem',
                                                borderRadius: '1rem',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                gap: '1rem'
                                            }}>
                                                <div style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                    {task.day}
                                                </div>
                                                <div style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>
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

            {/* Monetization Strategy Section */}
            <div style={{ marginTop: '5rem', marginBottom: '5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2.5rem', textAlign: 'center' }}>Monetization Strategy</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {report.revenueForecast.pricingTiers?.map((tier, idx) => (
                        <div key={idx} style={{
                            background: idx === 1 ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
                            padding: '2.5rem',
                            borderRadius: '1.5rem',
                            border: idx === 1 ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {idx === 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '-2rem',
                                    background: '#10b981',
                                    color: 'white',
                                    padding: '0.2rem 3rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    transform: 'rotate(45deg)'
                                }}>RECOMMENDED</div>
                            )}
                            <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{tier.name}</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.5rem' }}>{tier.price}</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {tier.features.map((f, i) => (
                                    <li key={i} style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: '#10b981' }}>✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Trust Section */}
            <div style={{
                textAlign: 'center',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '3rem',
                color: '#64748b',
                fontSize: '0.85rem'
            }}>
                Generated by MarketVibe Terminal v4.0 • Analysis based on 2026 Sentiment Data
            </div>
        </div>
    );
};

export default NicheValidator;
