import React from 'react';
import AdSenseUnit from '../components/AdSenseUnit';

const LandingPage = () => {
    return (
        <div className="landing-container">
            {/* Background Animations */}
            <div className="bg-scan-line"></div>

            {/* Hero Section */}
            <section className="hero" style={{ textAlign: 'center', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ maxWidth: '900px' }}>
                    <div className="section-label" style={{ marginBottom: '2rem' }}>Autonomous Smart Contract Auditor v3.0</div>
                    <h1 className="heading-xl" style={{ marginBottom: '1.5rem' }}>
                        Secure Any Protocol with <span className="text-gradient">Real-Time Threat Intelligence</span>
                    </h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                        Deploy with absolute certainty. MarketVibe leverages Grok-powered static analysis to detect reentrancy, oracle manipulation, and critical vulnerabilities before you push to mainnet.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/scan" className="btn-glow" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', textDecoration: 'none' }}>Initiate Security Scan</a>
                        <a href="/audit" className="btn-secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: '#fff', textDecoration: 'none', borderRadius: '12px' }}>Request Deep-Dive Audit</a>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section style={{ background: 'rgba(99, 102, 241, 0.02)', borderTop: '1px solid rgba(99, 102, 241, 0.1)', borderBottom: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <div className="section-label" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>The Security Gap</div>
                        <h2 className="heading-lg">Why 90% of <span style={{ color: '#6366f1' }}>Web3 Hacks Happen</span></h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        <div className="glass-card" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Blind Deployments</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Rushing to Mainnet</h3>
                            <p style={{ color: 'var(--text-dim)' }}>Deploying without exhaustive formal verification leaves protocols exposed to logic flaws that human auditors miss.</p>
                        </div>
                        <div className="glass-card" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>🧩</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Hidden Attack Vectors</h3>
                            <p style={{ color: 'var(--text-dim)' }}>Complex composability creates attack vectors that basic linters and standard test suites simply cannot detect.</p>
                        </div>
                        <div className="glass-card" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>⏳</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Slow Manual Audits</h3>
                            <p style={{ color: 'var(--text-dim)' }}>Waiting weeks and paying $50k+ for traditional security firms stalls innovation and delays your product launch.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <div className="section-label">Real-Time Architecture</div>
                        <h2 className="heading-lg">Grok-Powered <span className="text-gradient">Protocol Reasoning</span></h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {[
                            { title: 'Static Analysis', desc: 'Deep bytecode traversal to detect hidden flaws and unauthorized state changes.', icon: '🔎' },
                            { title: 'Oracle Telemetry', desc: 'Real-time monitoring of price feed vulnerabilities and flash loan manipulation vectors.', icon: '📡' },
                            { title: 'Logic Verification', desc: 'Mathematical proofs of your smart contract architecture to ensure absolute invariant control.', icon: '🛡️' },
                            { title: 'Automated Exploits', desc: 'Testing your protocol against 10,000+ known attack vectors before malicious actors do.', icon: '⚔️' }
                        ].map((feat, i) => (
                            <div key={i} className="glass-card">
                                <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{feat.icon}</div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.75rem' }}>{feat.title}</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ background: 'rgba(16, 185, 129, 0.02)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 className="heading-lg" style={{ marginBottom: '4rem' }}>The Path to <span className="text-gradient">Protocol Security</span></h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap' }}>
                        {[
                            { step: '01', title: 'Submit Contract', desc: 'Input your source code or isolated contract address.' },
                            { step: '02', title: 'Automated Audit', desc: 'Our agents perform deep vulnerability mapping.' },
                            { step: '03', title: 'Receive Audit Report', desc: 'Get your security score and full remediation steps.' }
                        ].map((s, i) => (
                            <div key={i} style={{ maxWidth: '250px' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(16, 185, 129, 0.1)', marginBottom: '1rem' }}>{s.step}</div>
                                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{s.title}</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Protocol Leaderboard (Top-Tier Trust) */}
            <section style={{ padding: '8rem 0', background: '#000' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <div className="section-label">Live Intelligence</div>
                            <h2 className="heading-lg">Live Threat <span className="text-gradient">Detection Map</span></h2>
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'right' }}>
                            Last Data Refresh: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>JUST NOW</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {[
                            { name: 'Reentrancy Attack', type: 'DeFi Protocol', score: 'CRIT', status: 'CRITICAL WARNING' },
                            { name: 'Flash Loan Manipulation', type: 'DEX / Oracle', score: 'HIGH', status: 'HIGH RISK' },
                            { name: 'Front-Running Mitigation', type: 'MEV Infrastructure', score: 'SAFE', status: 'SECURE / VERIFIED' },
                            { name: 'Signature Replay', type: 'Authentication', score: 'WARN', status: 'EXPLOITABLE' }
                        ].map((p, i) => (
                            <div key={i} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 3rem' }}>
                                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{p.name[0]}</div>
                                    <div>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{p.name}</h4>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{p.type} Sector</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>THREAT LEVEL</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: p.score === 'CRIT' || p.score === 'HIGH' || p.score === 'WARN' ? '#ef4444' : 'var(--primary)' }}>{p.score}</div>
                                    </div>
                                    <div className={`badge ${p.score === 'SAFE' ? 'badge-low' : 'badge-high'}`} style={{ width: '150px', textAlign: 'center' }}>{p.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Web3 Infrastructure Section */}
                    <div style={{ marginTop: '6rem', padding: '4rem', background: 'rgba(59,130,246,0.05)', borderRadius: '24px', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Optimized for <span style={{ color: '#3b82f6' }}>Web3 Forensics</span></h2>
                                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: 1.8 }}>
                                    MarketVibe Web3 isn't just a layer—it's built on decentralized intelligence. Connect your wallet to access on-chain revenue telemetry, NFT-gated trends, and soulbound security certificates.
                                </p>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem', display: 'grid', gap: '1rem' }}>
                                    <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ color: '#3b82f6' }}>⚡</span> Low-Latency RPC Integration</li>
                                    <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ color: '#3b82f6' }}>⚡</span> Soulbound Proof-of-Audit (SBT)</li>
                                    <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ color: '#3b82f6' }}>⚡</span> On-Chain Venture Logic Verification</li>
                                </ul>
                            </div>
                            <div style={{ background: '#000', padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                <div style={{ color: '#3b82f6', marginBottom: '1rem' }}>&gt; Initializing Web3 Layer...</div>
                                <div style={{ color: '#10b981' }}>[SUCCESS] Wallet Provider Detected</div>
                                <div style={{ color: '#94a3b8' }}>[INFO] Fetching On-Chain TVL Telemetry...</div>
                                <div style={{ color: '#ef4444' }}>[ALERT] Smart Contract Divergence Found</div>
                                <div style={{ height: '40px' }}></div>
                                <div style={{ textAlign: 'center', opacity: 0.5 }}>- DECENTRALIZED INTEL ACTIVE -</div>
                            </div>
                        </div>
                    </div>

                    {/* AdSense Unit */}
                    <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase' }}>Security Protocol Sponsored Signal</div>
                        <AdSenseUnit />
                    </div>
                </div>
            </section>

            {/* Proof Section */}
            <section id="proof">
                <div className="container">
                    <div className="glass-card" style={{ background: 'linear-gradient(rgba(15, 23, 42, 0.9), rgba(16, 185, 129, 0.05))', padding: '4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff' }}>Uncovered a <span className="text-gradient">€1.2M Exploit Vector</span></h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                                We recently analyzed a prominent lending protocol and identified a specific fallback function vulnerability that automated tools missed.
                            </p>
                            <a href="/scan" className="btn-glow" style={{ padding: '1rem 2rem', textDecoration: 'none' }}>Run Your Scan</a>
                        </div>
                        <div style={{ background: 'var(--code-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            <div style={{ color: '#ef4444', marginBottom: '1rem' }}>[!] CRITICAL-THREAT SIGNAL DETECTED</div>
                            <div style={{ color: '#94a3b8' }}>Sector: DeFi Lending</div>
                            <div style={{ color: '#94a3b8' }}>Vulnerability: Unprotected Fallback Function</div>
                            <div style={{ color: '#94a3b8', marginTop: '1rem' }}>{`{ "exploit_risk": "Critical", "tvl_at_risk": "$1.2M", "attack_vector": "Reentrancy" }`}</div>
                            <div style={{ color: '#ef4444', marginTop: '1rem' }}>RECOMMENDATION: PATCH BEFORE MAINNET</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{ textAlign: 'center', padding: '10rem 0' }}>
                <div className="container">
                    <h2 className="heading-xl" style={{ marginBottom: '2rem' }}>Secure Your <span className="text-gradient">Protocol Launch</span></h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Join 2,000+ protocol developers using MarketVibe to ensure their smart contracts are bulletproof.
                    </p>
                    <a href="/scan" className="btn-glow" style={{ padding: '1.5rem 4rem', fontSize: '1.2rem', textDecoration: 'none' }}>Initiate Platform Security Scan</a>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
