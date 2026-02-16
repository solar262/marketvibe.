import React, { useState } from 'react';
import { generateScorecard } from '../lib/scorecard';
import VerificationBadge from './VerificationBadge';
import { generateMVPCode } from '../lib/mvp_templates';

const ResultsView = ({ results, unlocked, onUnlock, spots, loading, planType = 'founder', leads = [], usageCount = 0, leadId = null }) => {
    // Add safe defaults for old data migration
    const {
        landingPage = { headline: '', subheadline: '', features: [], cta: '', socialProof: '' },
        revenueForecast = { estimatedAnnualRevenue: '0', totalAddressableMarket: '0', pricingTiers: [] },
        executionPlan = [],
        founderAssets = { outreachEmail: { subject: '', body: '' }, socialTemplate: { reddit: '', twitter: '' } },
        competitorIntelligence = [],
        expertAdCopy = { facebook: { headline: '', body: '', cta: '' }, google: { headline: '', description: '' } }
    } = results || {};

    const [downloading, setDownloading] = useState(false);
    const [completedTasks, setCompletedTasks] = useState({});

    const toggleTask = (weekIndex, taskIndex) => {
        const key = `${weekIndex}-${taskIndex}`;
        setCompletedTasks(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleDownloadScorecard = async () => {
        setDownloading(true);
        try {
            const name = results.projectName || landingPage.headline.split(' ').slice(-1)[0];
            const dataUrl = await generateScorecard({ name, results });
            const link = document.createElement('a');
            link.download = `marketvibe-scorecard-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Scorecard generation failed:", err);
        } finally {
            setDownloading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard! 📋");
    };

    return (
        <div className={`results-view ${planType === 'expert' ? 'expert-mode' : ''}`} style={{ position: 'relative', textAlign: 'left', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    .results-view { color: black !important; background: white !important; padding: 0 !important; }
                    .results-view * { color: black !important; border-color: #ddd !important; }
                    ${planType === 'expert' ? '.mv-branding { display: none !important; }' : ''}
                }
                `}
            </style>

            {!unlocked && usageCount >= 3 && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ Validation Limit Reached</h3>
                    <p style={{ fontSize: '0.9rem', color: '#f87171' }}>
                        Free accounts are limited to 3 validations. Upgrade to **Founder** to unlock unlimited tests and your full execution roadmap.
                    </p>
                </div>
            )}
            <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
                <h2 style={{ color: '#6366f1', marginBottom: '1rem' }}>🚀 Your Lead Magnet Strategy</h2>
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{landingPage.headline}</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{landingPage.subheadline}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {landingPage.features.map((f, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                                <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>{f.title}</h4>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{f.detail}</p>
                            </div>
                        ))}
                    </div>

                    <button className="btn-primary" style={{ pointerEvents: 'none' }}>{landingPage.cta}</button>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#475569' }}>{landingPage.socialProof}</p>
                </div>
            </div>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3rem' }}>
                <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>📈 Revenue Forecast (Year 1)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Est. Annual Revenue</p>
                        <h3 style={{ fontSize: '2rem', color: '#10b981' }}>${revenueForecast.estimatedAnnualRevenue}</h3>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Target Market Size</p>
                        <h3 style={{ fontSize: '2rem' }}>{revenueForecast.totalAddressableMarket}</h3>
                    </div>
                </div>

                <h4 style={{ marginBottom: '1rem' }}>Pricing Strategy</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {revenueForecast.pricingTiers.map((tier, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ fontWeight: 'bold' }}>{tier.name}</p>
                            <p style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>{tier.price}</p>
                            <ul style={{ padding: 0, listStyle: 'none', fontSize: '0.75rem', color: '#94a3b8' }}>
                                {tier.features.map((f, j) => <li key={j}>✓ {f}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Expert Only: Competitor Intelligence */}
                <div style={{ marginTop: '2rem', filter: planType === 'expert' ? 'none' : 'blur(4px)', opacity: planType === 'expert' ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>🛰️ Competitor Intelligence</h4>
                        {planType !== 'expert' && <span style={{ fontSize: '0.65rem', background: '#fbbf24', color: '#000', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>EXPERT ONLY 💎</span>}
                    </div>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {competitorIntelligence.map((comp, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{comp.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Weakness: {comp.weakness}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}><strong>Expert Strategy:</strong> {comp.strategy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Viral Verification Loop */}
            {unlocked && (
                <div style={{
                    marginTop: '3rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    borderRadius: '24px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        🛡️ Proof of Validation
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                        Your idea has a high-intent validation score. Embed this trust badge on your landing page to increase visitor conversion.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <VerificationBadge score={results.overallScore} leadId={leadId} />
                        <button
                            onClick={() => {
                                const code = `<a href="https://www.marketvibe1.com/og-preview/${leadId}?ref=badge&lid=${leadId}" target="_blank"><img src="https://www.marketvibe1.com/logo.svg" style="width: 150px;" alt="Validated by MarketVibe"></a>`;
                                navigator.clipboard.writeText(code);
                                alert("Embed code copied to clipboard! 📋");
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94a3b8',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                            📋 Copy Embed Code
                        </button>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '3rem', position: 'relative' }}>
                <div style={{
                    filter: unlocked ? 'none' : 'blur(12px)',
                    opacity: unlocked ? 1 : 0.2,
                    pointerEvents: unlocked ? 'auto' : 'none',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <h2 style={{ color: '#f59e0b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        💎 The 30-Day Execution Playbook
                        {planType === 'expert' && (
                            <span style={{
                                fontSize: '0.75rem',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                letterSpacing: '0.05em',
                                fontWeight: 'bold'
                            }}>
                                EXPERT TIER 🛡️
                            </span>
                        )}
                    </h2>

                    {Array.isArray(executionPlan) && executionPlan.length > 0 ? (
                        executionPlan.map((week, wIndex) => (
                            <div key={wIndex} style={{ marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '1.1rem', color: '#f59e0b', marginBottom: '1.25rem', borderLeft: '4px solid #f59e0b', paddingLeft: '1rem' }}>
                                    {week.week}
                                </h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {week.tasks.map((t, tIndex) => (
                                        <div
                                            key={tIndex}
                                            onClick={() => toggleTask(wIndex, tIndex)}
                                            style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                opacity: completedTasks[`${wIndex}-${tIndex}`] ? 0.5 : 1,
                                                transition: 'opacity 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                border: '2px solid #f59e0b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {completedTasks[`${wIndex}-${tIndex}`] && <span style={{ color: '#f59e0b' }}>✓</span>}
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase' }}>{t.day}</span>
                                                <p style={{ fontSize: '0.95rem', color: '#fff' }}>{t.task}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#94a3b8', fontStyle: 'italic', marginBottom: '2rem' }}>
                            Roadmap is being generated for your niche...
                        </p>
                    )}

                    <h2 style={{ color: '#6366f1', margin: '4rem 0 1.5rem 0' }}>🛠️ Founder Asset Library</h2>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {founderAssets?.outreachEmail && (
                            <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ color: '#818cf8' }}>Cold Outreach Email</h4>
                                    <button onClick={() => copyToClipboard(founderAssets.outreachEmail.body)} style={{ fontSize: '0.75rem', background: '#6366f1', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Copy Body</button>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}><strong>Subject:</strong> {founderAssets.outreachEmail.subject}</p>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                    {founderAssets.outreachEmail.body}
                                </pre>
                            </div>
                        )}

                        {founderAssets?.socialTemplate && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Social Posting Templates</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Reddit Post</p>
                                        <pre onClick={() => copyToClipboard(founderAssets.socialTemplate.reddit)} style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', height: '100px', overflow: 'auto', cursor: 'pointer' }}>
                                            {founderAssets.socialTemplate.reddit}
                                        </pre>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>X (Twitter) Post</p>
                                        <pre onClick={() => copyToClipboard(founderAssets.socialTemplate.twitter)} style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', height: '100px', overflow: 'auto', cursor: 'pointer' }}>
                                            {founderAssets.socialTemplate.twitter}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expert Only: AI Ad Copy */}
                    <div style={{ marginTop: '3rem', filter: planType === 'expert' ? 'none' : 'blur(4px)', opacity: planType === 'expert' ? 1 : 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: '#ef4444', margin: 0 }}>📣 Expert Ad-Copy Generator</h2>
                            {planType !== 'expert' && <span style={{ fontSize: '0.75rem', background: '#fbbf24', color: '#000', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>UPGRADE TO EXPERT 💎</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <h4 style={{ color: '#f87171', marginBottom: '1rem' }}>Facebook/Instagram Script</h4>
                                <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>{expertAdCopy.facebook.headline}</p>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0' }}>{expertAdCopy.facebook.body}</p>
                                <button onClick={() => copyToClipboard(expertAdCopy.facebook.body)} style={{ width: '100%', background: '#6366f1', border: 'none', padding: '0.5rem', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Copy FB Ad</button>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Google Search Ad</h4>
                                <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>{expertAdCopy.google.headline}</p>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0' }}>{expertAdCopy.google.description}</p>
                                <button onClick={() => copyToClipboard(expertAdCopy.google.description)} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Copy Google Ad</button>
                            </div>
                        </div>
                    </div>
                    {planType === 'expert' && leads && leads.length > 0 && (
                        <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ color: '#10b981', margin: 0, fontSize: '1.5rem' }}>⛽ Live Growth Fuel (Expert Only)</h2>
                                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '10px' }}>5 NEW LEADS FOUND</div>
                            </div>
                            <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' }}>The Sentinel is scouting real-time interest across Reddit & Twitter. Here are candidates ready for your pitch:</p>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {leads.map((lead, idx) => (
                                    <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <span style={{ fontWeight: 'bold', color: '#fff' }}>@{lead.username || 'Anonymous'}</span>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>VIA {lead.platform?.toUpperCase()}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '1rem' }}>"{lead.post_content?.substring(0, 150)}..."</p>
                                        <button
                                            onClick={() => copyToClipboard(lead.draft_reply)}
                                            style={{ fontSize: '0.75rem', background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            Copy Expert Reply Script
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {results.expertNarrative && (
                    <div className="expert-narrative-box" style={{
                        marginTop: '3rem',
                        padding: '2.5rem',
                        background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        textAlign: 'left',
                        boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.6rem', background: '#6366f1', borderRadius: '12px', fontSize: '1.2rem' }}>🛰️</div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', margin: 0 }}>Expert Analysis</h3>
                                <p style={{ color: '#818cf8', fontSize: '0.8rem', margin: 0, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Programmatically Generated Intelligence
                                </p>
                            </div>
                        </div>
                        <div style={{
                            color: '#cbd5e1',
                            lineHeight: '1.7',
                            fontSize: '1rem',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {results.expertNarrative.replace(/## /g, '').replace(/### /g, '').replace(/\*\*/g, '')}
                        </div>
                    </div>
                )}

                {!unlocked && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.98)',
                            padding: '3.5rem',
                            borderRadius: '32px',
                            border: '2px solid #6366f1',
                            textAlign: 'center',
                            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.9)',
                            maxWidth: '550px'
                        }}>
                            <div className="badge" style={{ marginBottom: '1.5rem', background: '#6366f1' }}>Founder's Offer: {spots} spots left</div>
                            <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Unlock Your Professional Playbook 💎</h3>
                            <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
                                Get the full **30-Day Execution Roadmap**, niche-specific **Outreach Scripts**, and lifetime access to our scaling tools.
                                <br /><br />
                                <strong>Transform this analysis into a $1,000/mo business.</strong>
                            </p>

                            <button
                                onClick={() => onUnlock('founder')}
                                className="btn-primary"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '1.5rem',
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)'
                                }}
                            >
                                {loading ? 'Preparing Plan...' : 'Unlock Full Execution Playbook — $49'}
                            </button>
                            <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#475569' }}>
                                One-time payment. Instant delivery. Full Commercial Rights.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '5rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center', opacity: unlocked ? 1 : 0.3 }}>
                <button
                    onClick={handleDownloadScorecard}
                    className="btn-primary"
                    disabled={downloading}
                    style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span>🖼️</span> {downloading ? 'Generating...' : 'Download Viral Scorecard'}
                </button>

                {unlocked && (
                    <button
                        onClick={() => {
                            const code = generateMVPCode({
                                name: results?.projectName || 'MarketVibe',
                                landingPage: results?.landingPage || landingPage,
                                revenueForecast: results?.revenueForecast || revenueForecast
                            });
                            const blob = new Blob([code], { type: 'text/javascript' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${(results?.projectName || 'marketvibe').toLowerCase().replace(/ /g, '-')}-mvp.js`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            alert("🚀 MVP Boilerplate Generated! Check your downloads.");
                        }}
                        className="btn-primary"
                        style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid #6366f1',
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 'bold'
                        }}
                    >
                        <span>🛠️</span> Export MVP Code
                    </button>
                )}

                <button
                    onClick={() => {
                        const revenue = revenueForecast.estimatedAnnualRevenue;
                        const shareUrl = leadId ? `https://www.marketvibe1.com/og-preview/${leadId}` : `https://www.marketvibe1.com`;
                        const text = `I just validated a $${revenue}/yr business idea on @MarketVibe in 60 seconds! 🚀\n\nMy 30-day roadmap is ready. Stop guessing, start building. 💎\n\nView my Growth Scorecard: ${shareUrl}`;
                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                        window.open(twitterUrl, '_blank');
                    }}
                    className="btn-primary"
                    style={{
                        background: 'rgba(29, 155, 240, 0.1)',
                        border: '1px solid #1d9bf0',
                        color: '#1d9bf0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span>🐦</span> Share Traction
                </button>

                <button
                    onClick={() => {
                        const revenue = revenueForecast.estimatedAnnualRevenue;
                        const shareUrl = leadId ? `https://www.marketvibe1.com/og-preview/${leadId}` : `https://www.marketvibe1.com`;
                        const title = `I just used AI to validate a $${revenue}/yr business idea in 60 seconds. My 30-day roadmap is ready.`;
                        const redditUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
                        window.open(redditUrl, '_blank');
                    }}
                    className="btn-primary"
                    style={{
                        background: 'rgba(255, 69, 0, 0.1)',
                        border: '1px solid #ff4500',
                        color: '#ff4500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span>👽</span> Reddit Bait
                </button>

                <button
                    onClick={() => {
                        if (unlocked) {
                            window.print();
                        } else {
                            onUnlock('founder');
                        }
                    }}
                    className="btn-primary"
                    style={{
                        background: 'transparent',
                        border: '1px solid #6366f1',
                        color: '#6366f1'
                    }}
                >
                    {unlocked ? (planType === 'expert' ? '📄 Whitelabel PDF Export' : 'Download PDF Playbook') : 'Pay to Download PDF'}
                </button>
            </div>
        </div >
    );
};

export default React.memo(ResultsView);
