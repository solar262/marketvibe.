import React, { useState } from 'react';
import AdSenseUnit from '../components/AdSenseUnit';

const ArticleCard = ({ category, title, excerpt, url }) => (
    <a href={url} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }} className="article-card">
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid #eef2f6',
            borderRadius: '20px',
            padding: '2rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02), 0 1px 1px rgba(0,0,0,0.02)'
        }}>
            <div>
                <span style={{ 
                    color: 'var(--primary)', 
                    fontWeight: '800', 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    display: 'inline-block',
                    marginBottom: '0.75rem',
                    background: 'rgba(29, 78, 216, 0.05)',
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
                    lineHeight: '1.2',
                    letterSpacing: '-0.02em'
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
                Analysis <span>&rarr;</span>
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
        borderBottom: '1px solid #f1f5f9', 
        textDecoration: 'none',
        transition: 'background 0.2s'
    }} className="sidebar-tool">
        <div style={{ fontSize: '1.5rem', filter: 'grayscale(0.2)' }}>{icon}</div>
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
        <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>
            <style>{`
                .article-card:hover > div {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
                    transform: translateY(-4px);
                    border-color: var(--primary);
                }
                .sidebar-tool:hover {
                    background: #f8fafc;
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
                        {/* MAIN HERO SECTION */}
                <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        color: 'var(--primary)',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <span style={{ fontSize: '1rem' }}>✨</span> THE ULTIMATE FOUNDER'S TOOLKIT
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                        lineHeight: '1.1',
                        letterSpacing: '-0.02em',
                        marginBottom: '1.5rem',
                        fontWeight: '800'
                    }}>
                        Validate Your <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Startup Idea With AI.</span>
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
                        color: 'var(--text-muted)',
                        maxWidth: '700px',
                        margin: '0 auto 3rem',
                        lineHeight: '1.6'
                    }}>
                        Stop guessing and start building. MarketVibe provides data-driven revenue forecasts, competitor intelligence, and 30-day execution plans in seconds.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/validate" onClick={(e) => { e.preventDefault(); onNavigate('setup'); }} className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Validate My Idea →
                        </a>
                        <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog-index'); }} className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Explore Market Analysis
                        </a>
                    </div>
                </div>
                    </div>

                    {/* Market Velocity Ticker */}
                    <div style={{ marginBottom: '4rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Velocity</span>
                            </div>
                            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ display: 'inline-block', paddingLeft: '100%', animation: 'ticker 40s linear infinite', fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                                    [DETECTED] 'AI Cybersecurity' heat score spikes to 94 • [UP] 'Micro-Carbon Credit' volume +12% • [ALERT] 'Personalized Nutrition' signals detected in UK • [TREND] 'AR Industrial Training' Enterprise adoption rising • 
                                </div>
                            </div>
                        </div>
                        <style>{`
                            @keyframes ticker {
                                0% { transform: translate(0, 0); }
                                100% { transform: translate(-100%, 0); }
                            }
                            @keyframes pulse {
                                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                                70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                            }
                        `}</style>
                    </div>

                    {/* Featured Hero Article */}
                    <div style={{ marginBottom: '5rem' }}>
                        <a href="/validate/saas" style={{ textDecoration: 'none' }} className="article-card">
                            <div style={{
                                background: 'white', 
                                border: '1px solid #eef2f6', 
                                borderRadius: '32px', 
                                overflow: 'hidden',
                                boxShadow: '0 30px 60px -12px rgba(15, 23, 42, 0.12)',
                                transition: 'transform 0.3s ease'
                            }}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', 
                                    height: '280px', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: '3rem',
                                    position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: '0', right: '0', bottom: '0', left: '0', opacity: '0.1', backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                    <span style={{ 
                                        display: 'inline-block',
                                        width: 'fit-content',
                                        background: 'rgba(255,255,255,0.1)', 
                                        backdropFilter: 'blur(10px)',
                                        color: 'white', 
                                        padding: '6px 14px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: '800', 
                                        borderRadius: '8px', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.1em',
                                        marginBottom: '1.5rem',
                                        border: '1px solid rgba(255,255,255,0.2)'
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

                    <div style={{ margin: '3rem 0', background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>Recommended for Founders</div>
                        <AdSenseUnit format="autorelaxed" />
                    </div>

                    {/* Trending Grid */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
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
                            url="/validate/ai-agents" 
                        />
                    </div>
                </main>

                {/* Sidebar (30%) */}
                <aside className="mag-sidebar">
                    {/* Search / Lead Gen Widget */}
                    <div style={{ background: '#fff', border: '1px solid #eef2f6', padding: '2rem', borderRadius: '24px', marginBottom: '3rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '900', color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Market Scanner</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: '1.5' }}>Scan any niche to detect signals, TAM, and revenue potential instantly.</p>
                        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                                type="text" 
                                placeholder="e.g. AI for Lawyers" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', background: '#f8fafc' }}
                                required
                            />
                            <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }} className="btn-glow">
                                Run Scan
                            </button>
                        </form>
                    </div>

                    <div style={{ position: 'sticky', top: '100px' }}>
                        <div style={{ marginBottom: '3rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '900', color: '#94a3b8', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Core Systems
                            </h4>
                            <div style={{ background: '#fff', border: '1px solid #eef2f6', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                <SidebarTool icon="💎" title="Naming Intelligence" url="/tools/naming" />
                                <SidebarTool icon="📈" title="Global TAM Engine" url="/tools/market-size" />
                                <SidebarTool icon="⚡" title="Founder Launchpad" url="/launchpad" />
                            </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '20px', minHeight: '340px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center', fontWeight: '800', letterSpacing: '0.05em' }}>Revenue Partner</div>
                            <AdSenseUnit format="autorelaxed" />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default LandingPage;
