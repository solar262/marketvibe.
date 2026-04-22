import React, { useState } from 'react';
import AdSenseUnit from '../components/AdSenseUnit';
import LiveSigmaFeed from '../components/LiveSigmaFeed';

const ArticleCard = ({ category, title, excerpt, url }) => (
    <a href={url} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }} className="article-card">
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '2rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <div>
                <span style={{ 
                    color: 'var(--accent)', 
                    fontWeight: '800', 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    display: 'inline-block',
                    marginBottom: '0.75rem',
                    background: 'rgba(236, 72, 153, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px'
                }}>
                    {category}
                </span>
                <h3 style={{ 
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.35rem', 
                    fontWeight: '800', 
                    color: 'var(--text)', 
                    marginBottom: '0.75rem', 
                    lineHeight: '1.2'
                }}>
                    {title}
                </h3>
                <p style={{ 
                    color: 'var(--text-dim)', 
                    fontSize: '0.95rem', 
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '2rem'
                }}>
                    {excerpt}
                </p>
            </div>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--primary)', 
                fontWeight: '800', 
                fontSize: '0.85rem' 
            }}>
                Access Intelligence <span>&rarr;</span>
            </div>
        </div>
    </a>
);

const SidebarTool = ({ icon, title, url }) => (
    <a href={url} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1.25rem', 
        padding: '1.25rem', 
        borderBottom: '1px solid var(--glass-border)', 
        textDecoration: 'none',
        transition: 'background 0.2s'
    }} className="sidebar-tool">
        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
        <div>
            <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem' }}>{title}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: '500' }}>Intelligence Module</div>
        </div>
    </a>
);

const LandingPage = () => {
    const [search, setSearch] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (!search) return;
        window.location.href = `/validate/${search.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    };

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem', color: 'var(--text)' }}>
            <style>{`
                .article-card:hover > div {
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
                    transform: translateY(-4px);
                    border-color: var(--primary);
                    background: rgba(17, 24, 39, 0.9);
                }
                .sidebar-tool:hover {
                    background: rgba(255, 255, 255, 0.03);
                }
                .mag-layout {
                    display: flex;
                    gap: 4rem;
                    padding-top: 3rem;
                }
                .mag-main { flex: 1; min-width: 0; }
                .mag-sidebar { width: 340px; flex-shrink: 0; }
                @media (max-width: 1024px) {
                    .mag-layout { gap: 2rem; }
                    .mag-sidebar { width: 300px; }
                }
                @media (max-width: 900px) {
                    .mag-layout { flex-direction: column; gap: 4rem; }
                    .mag-sidebar { width: 100%; }
                }
            `}</style>

            <div className="container mag-layout">
                {/* Main Content Area (70%) */}
                <main className="mag-main">
                    <div style={{ marginBottom: '3rem' }}>
                        {/* HERO 2.0: THE INTELLIGENCE DASHBOARD */}
                        <div style={{ padding: '4rem 0', textAlign: 'left' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'rgba(236, 72, 153, 0.1)',
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                color: 'var(--accent)',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                marginBottom: '1.5rem',
                                border: '1px solid rgba(236, 72, 153, 0.2)',
                                letterSpacing: '0.05em'
                            }}>
                                <span style={{ fontSize: '1rem', animation: 'spin 4s linear infinite' }}>⚛️</span> MARKETVIBE QUANTUM V2.0 LIVE
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                                lineHeight: '1',
                                letterSpacing: '-0.04em',
                                marginBottom: '1.5rem',
                                fontWeight: '900',
                            }}>
                                Autonomous <br />
                                <span style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>Revenue Intelligence.</span>
                            </h1>
                            <p style={{
                                fontSize: '1.2rem',
                                color: 'var(--text-dim)',
                                maxWidth: '650px',
                                marginBottom: '3rem',
                                lineHeight: '1.6'
                            }}>
                                Move faster than the market. Deploy AI scanners to detect viral niches, validate revenue potential, and extract execution blueprints in 12 seconds.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <a href="/validate" className="btn-glow" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '12px' }}>
                                    Initialize Scan &rarr;
                                </a>
                                <a href="/launchpad" className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
                                    Founder Index
                                </a>
                            </div>
                        </div>
                    </div>

                    <LiveSigmaFeed />

                    {/* Featured Hero Article */}
                    <div style={{ marginBottom: '5rem' }}>
                        <a href="/validate/saas" style={{ textDecoration: 'none' }} className="article-card">
                            <div style={{
                                background: 'rgba(17, 24, 39, 0.4)', 
                                border: '1px solid var(--glass-border)', 
                                borderRadius: '32px', 
                                overflow: 'hidden',
                                boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)',
                                transition: 'transform 0.3s ease'
                            }}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', 
                                    height: '280px', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: '3rem',
                                    position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: '0', right: '0', bottom: '0', left: '0', opacity: '0.05', backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                    <span style={{ 
                                        display: 'inline-block',
                                        width: 'fit-content',
                                        background: 'rgba(255,255,255,0.05)', 
                                        backdropFilter: 'blur(10px)',
                                        color: 'white', 
                                        padding: '6px 14px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: '800', 
                                        borderRadius: '8px', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.1em',
                                        marginBottom: '1.5rem',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>⭐ Featured Report</span>
                                    <h2 style={{ 
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 'clamp(1.8rem, 4vw, 3rem)', 
                                        fontWeight: '900', 
                                        color: '#fff', 
                                        margin: 0, 
                                        letterSpacing: '-0.04em', 
                                        lineHeight: '1.1' 
                                    }}>
                                        The 2026 SaaS Playbook
                                    </h2>
                                </div>
                                <div style={{ padding: '3rem' }}>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: '400' }}>
                                        Autonomous teardowns of the highest-converting B2B software niches. Includes TAM valuations and 30-day GTM blueprints.
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: '900', fontSize: '1.1rem' }}>
                                        Open Intelligence File <span>&rarr;</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>

                    <div style={{ margin: '3rem 0', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>Intelligence Partner</div>
                        <AdSenseUnit format="autorelaxed" />
                    </div>

                    {/* Trending Grid */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>Intelligence Briefings</h3>
                        <a href="/hub" style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'none', fontSize: '0.9rem' }}>Index &rarr;</a>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                        <ArticleCard 
                            category="Real Estate Tech" 
                            title="PropTech Valuation Matrices" 
                            excerpt="A complete market breakdown of software tools needed by commercial real estate brokers for automated pipeline management." 
                            url="/validate/proptech" 
                        />
                        <ArticleCard 
                            category="Fintech" 
                            title="Payment Processing Arbitrage" 
                            excerpt="How small startup studios are capturing vast revenue by building niche gateways in high-velocity emerging markets." 
                            url="/validate/fintech" 
                        />
                        <ArticleCard 
                            category="Health & Wellness" 
                            title="Mental Health SaaS (2026)" 
                            excerpt="Validation data showing a massive 22% spike in B2B corporate wellness app demand for remote technical teams." 
                            url="/validate/healthtech" 
                        />
                        <ArticleCard 
                            category="AI Agents" 
                            title="Autonomous Sales Bots" 
                            excerpt="Why agents that perform actions are replacing conversational LLMs in Enterprise revenue operations." 
                            url="/validate/ai-agent" 
                        />
                    </div>
                </main>

                {/* Sidebar (30%) */}
                <aside className="mag-sidebar">
                    {/* Search / Lead Gen Widget */}
                    <div style={{ background: 'rgba(17, 24, 39, 0.4)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '24px', marginBottom: '3rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '900', color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Market Scanner</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: '1.5' }}>Scan any niche to detect signals, TAM, and revenue potential instantly.</p>
                        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                                type="text" 
                                placeholder="e.g. AI for Lawyers" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1.25rem', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', background: 'rgba(15, 23, 42, 0.5)', color: '#fff' }}
                                required
                            />
                            <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }} className="btn-glow">
                                Run Scan
                            </button>
                        </form>
                    </div>

                    <div style={{ position: 'sticky', top: '100px' }}>
                        <div style={{ marginBottom: '3rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '900', color: '#475569', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Core Systems
                            </h4>
                            <div style={{ background: 'rgba(17, 24, 39, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '20px', overflow: 'hidden' }}>
                                <SidebarTool icon="💎" title="Naming Intelligence" url="/tools/naming" />
                                <SidebarTool icon="📈" title="Global TAM Engine" url="/tools/market-size" />
                                <SidebarTool icon="⚡" title="Founder Launchpad" url="/launchpad" />
                            </div>
                        </div>

                        <div style={{ background: 'rgba(17, 24, 39, 0.4)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '20px', minHeight: '340px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center', fontWeight: '800', letterSpacing: '0.05em' }}>Revenue Partner</div>
                            <AdSenseUnit format="autorelaxed" />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default LandingPage;
