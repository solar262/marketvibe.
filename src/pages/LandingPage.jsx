import React, { useState } from 'react';
import AdSenseUnit from '../components/AdSenseUnit';

const ArticleCard = ({ category, title, excerpt, url }) => (
    <a href={url} style={{ textDecoration: 'none', color: 'inherit' }} className="article-card">
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '1.5rem',
            height: '100%',
            transition: 'shadow 0.2s, transform 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {category}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', marginTop: '0.5rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                {title}
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {excerpt}
            </p>
        </div>
    </a>
);

const SidebarTool = ({ icon, title, url }) => (
    <a href={url} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--glass-border)', textDecoration: 'none' }}>
        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
        <div>
            <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem' }}>{title}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Free Intelligence Tool</div>
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
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }
                .mag-layout {
                    display: flex;
                    gap: 3rem;
                    padding-top: 2rem;
                }
                .mag-main { flex: 1; }
                .mag-sidebar { width: 340px; flex-shrink: 0; }
                @media (max-width: 900px) {
                    .mag-layout { flex-direction: column; gap: 2rem; }
                    .mag-sidebar { width: 100%; }
                }
            `}</style>

            <div className="container mag-layout">
                {/* Main Content Area (70%) */}
                <main className="mag-main">
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '1rem' }}>
                        Software Niches & Startup Data for 2026
                    </h1>
                    <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', marginBottom: '3rem', maxWidth: '700px', lineHeight: '1.6' }}>
                        MarketVibe provides autonomous intelligence, market sizes, and validation playbooks for founders building the next generation of SaaS.
                    </p>

                    {/* Market Velocity Ticker */}
                    <div style={{ marginBottom: '3rem', background: 'rgba(29, 78, 216, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Live Market Velocity</span>
                            </div>
                            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ display: 'inline-block', paddingLeft: '100%', animation: 'ticker 30s linear infinite', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600' }}>
                                    [SAAS] Signal detected in 'AI Customer Support' (+12%) • [FINTECH] Cross-border payments trending (+8%) • [PET-TECH] Smart tracking velocity spike (+15%) • [EDTECH] Micro-curriculum demand rising • 
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
                    <div style={{ marginBottom: '4rem' }}>
                        <a href="/validate/saas" style={{ textDecoration: 'none' }} className="article-card">
                            <div style={{
                                background: 'var(--card-bg)', 
                                border: '1px solid var(--primary)', 
                                borderRadius: '24px', 
                                overflow: 'hidden',
                                boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.15)',
                                display: 'block'
                            }}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
                                    height: '240px', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '2rem',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ 
                                        background: 'rgba(255,255,255,0.2)', 
                                        backdropFilter: 'blur(10px)',
                                        color: 'white', 
                                        padding: '6px 16px', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '800', 
                                        borderRadius: '99px', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.1em',
                                        marginBottom: '1rem',
                                        border: '1px solid rgba(255,255,255,0.3)'
                                    }}>⭐ Featured Intelligence Briefing</span>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-0.04em', lineHeight: '1' }}>
                                        The 2026 SaaS Playbook
                                    </h2>
                                </div>
                                <div style={{ padding: '2.5rem' }}>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                                        An exclusive teardown of the highest-converting B2B software niches. Discover exact TAM valuations and 30-day go-to-market strategies generated by our autonomous AI.
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '800', fontSize: '1.1rem' }}>
                                        Access Full Intelligence File <span>&rarr;</span>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--text)', paddingBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text)' }}>Latest Intelligence Files</h3>
                        <a href="/hub" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>View All &rarr;</a>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <ArticleCard 
                            category="Real Estate Tech" 
                            title="PropTech Valuation Matrices: Finding 7-Figure Opportunities" 
                            excerpt="A complete market breakdown of software tools needed by commercial real estate brokers." 
                            url="/validate/proptech" 
                        />
                        <ArticleCard 
                            category="Fintech" 
                            title="Payment Processing Arbitrage in Emerging Markets" 
                            excerpt="How small startup studios are capturing vast revenue by building niche gateways." 
                            url="/validate/fintech" 
                        />
                        <ArticleCard 
                            category="Health & Wellness" 
                            title="Mental Health SaaS: The $10B Uncapped Trend" 
                            excerpt="Validation data showing a massive spike in B2B corporate wellness app demand." 
                            url="/validate/healthtech" 
                        />
                        <ArticleCard 
                            category="AI Agents" 
                            title="The Rise of Autonomous Revenue: Stop Building Chatbots" 
                            excerpt="Why agents that perform actions are replacing conversational LLMs in Enterprise." 
                            url="/validate/ai-agents" 
                        />
                    </div>
                </main>

                {/* Sidebar (30%) */}
                <aside className="mag-sidebar">
                    {/* Search / Lead Gen Widget */}
                    <div style={{ background: '#f1f5f9', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.5rem' }}>Generate Free Blueprint</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Enter a niche to instantly generate a 30-day execution and revenue forecast.</p>
                        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input 
                                type="text" 
                                placeholder="e.g. AI for Dentists" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                                required
                            />
                            <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                                Scan Market
                            </button>
                        </form>
                    </div>

                    {/* Sticky Sidebar Elements */}
                    <div style={{ position: 'sticky', top: '100px' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text)', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                Essential Tools
                            </h4>
                            <div style={{ background: '#fff', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                <SidebarTool icon="🤖" title="Startup Name Generator" url="/tools/naming" />
                                <SidebarTool icon="📊" title="TAM/SAM/SOM Calculator" url="/tools/market-size" />
                                <SidebarTool icon="🚀" title="Startup Launchpad" url="/launchpad" />
                            </div>
                        </div>

                        {/* Sidebar Ad Formats (High RPM) */}
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '100%' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>Industry Insights</div>
                                <AdSenseUnit format="autorelaxed" />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default LandingPage;
