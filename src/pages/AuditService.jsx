import React, { useState } from 'react';
import { createCheckoutSession } from '../lib/stripe';

const AuditService = () => {
    const [status, setStatus] = useState('idle');

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('submitting');
        setTimeout(() => setStatus('success'), 2000);
    };

    return (
        <div style={{ padding: '6rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <div className="section-label">Protocol Deep-Dive</div>
                <h1 className="heading-lg" style={{ marginBottom: '1.5rem' }}>Professional <span className="text-gradient">Smart Contract Audits</span></h1>
                <p style={{ color: 'var(--text-dim)', maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem' }}>
                    Go beyond automated scans. Our senior analysts and security engineers perform deep-dive logic verification, re-entrancy vulnerability analysis, and TVL stress-tests.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginBottom: '6rem' }}>
                <div className="glass-card" style={{ border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Standard Analysis</h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Free automated scan with basic AI-generated insights across market and security vectors.</p>
                    <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>$0</div>
                    <button onClick={() => window.location.href='/scan'} className="btn-secondary" style={{ width: '100%' }}>USE FREE SCANNER</button>
                </div>
                <div className="glass-card" style={{ border: '2px solid var(--primary)', background: 'rgba(16, 185, 129, 0.05)', transform: 'scale(1.05)' }}>
                    <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#000', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>MOST POPULAR</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Professional Audit</h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Full static analysis, logic vulnerability detection, and a certified exportable report for mainnet deployment.</p>
                    <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>$49</div>
                    <button onClick={() => createCheckoutSession('', 'founder')} className="btn-glow" style={{ width: '100%' }}>GET PRIORITY AUDIT</button>
                </div>
                <div className="glass-card" style={{ border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Enterprise Mainnet</h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Line-by-line manual code review and custom invariant testing for scaling DeFi protocols.</p>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem', color: 'var(--text-dim)' }}>Custom Quote</div>
                    <button onClick={() => document.getElementById('audit-form').scrollIntoView({ behavior: 'smooth' })} className="btn-secondary" style={{ width: '100%' }}>CONTACT SECURITY</button>
                </div>
            </div>

            <div id="audit-form" className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2rem', textAlign: 'center' }}>Enterprise Inquiry</h2>
                
                {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Request Received</h3>
                        <p style={{ color: 'var(--text-dim)' }}>A security engineer will review your project and contact you within 6 hours.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>YOUR NAME</label>
                            <input type="text" className="input-field" required placeholder="Alex Rivera" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>BUSINESS EMAIL</label>
                            <input type="email" className="input-field" required placeholder="alex@project.io" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>GITHUB REPO / CONTRACT ADDRESS</label>
                            <input type="text" className="input-field" required placeholder="https://github.com/..." />
                        </div>
                        <button type="submit" disabled={status === 'submitting'} className="btn-glow" style={{ padding: '1.25rem', fontSize: '1rem' }}>
                            {status === 'submitting' ? 'INITIATING AUDIT...' : 'REQUEST PROTOCOL AUDIT'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuditService;
