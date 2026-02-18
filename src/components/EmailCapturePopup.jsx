import React, { useState, useEffect } from 'react';

/**
 * 🎯 Email Capture Popup
 * Shows after 8 seconds on landing page, or on exit intent (mouse leaves viewport).
 * Captures email and stores in Supabase for the nurture drip sequence.
 */
const EmailCapturePopup = ({ onEmailCaptured, supabase }) => {
    const [visible, setVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed or captured
        const dismissed = localStorage.getItem('mv_popup_dismissed');
        const captured = localStorage.getItem('mv_email_captured');
        if (dismissed || captured) return;

        // Show after 8 seconds
        const timer = setTimeout(() => setVisible(true), 8000);

        // Exit intent detection (mouse leaves top of viewport)
        const handleMouseLeave = (e) => {
            if (e.clientY <= 0 && !localStorage.getItem('mv_popup_dismissed')) {
                setVisible(true);
            }
        };
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            setVisible(false);
            setClosing(false);
            localStorage.setItem('mv_popup_dismissed', Date.now());
        }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;

        try {
            // Save to Supabase leads table
            if (supabase) {
                await supabase.from('leads').upsert({
                    email,
                    source: 'popup',
                    project_name: 'Landing Visitor',
                    paid: false,
                    last_nurture_step: 0,
                    created_at: new Date().toISOString()
                }, { onConflict: 'email' });
            }

            localStorage.setItem('mv_email_captured', email);
            setSubmitted(true);
            if (onEmailCaptured) onEmailCaptured(email);

            // Auto close after 3 seconds
            setTimeout(() => handleClose(), 3000);
        } catch (err) {
            console.error('Popup email capture error:', err);
        }
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                    animation: closing ? 'mvFadeOut 0.3s ease-out' : 'mvFadeIn 0.3s ease-out',
                }}
            />

            {/* Popup */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: closing ? 'translate(-50%, -50%) scale(0.9)' : 'translate(-50%, -50%) scale(1)',
                opacity: closing ? 0 : 1,
                transition: 'all 0.3s ease-out',
                zIndex: 9999,
                width: '90%',
                maxWidth: '440px',
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99, 102, 241, 0.15)',
                overflow: 'hidden',
            }}>
                {/* Close button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'rgba(255,255,255,0.1)', border: 'none',
                        color: '#999', fontSize: '18px', cursor: 'pointer',
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label="Close popup"
                >×</button>

                {/* Accent bar */}
                <div style={{
                    height: '4px',
                    background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
                }} />

                <div style={{ padding: '2rem 2rem 1.5rem' }}>
                    {!submitted ? (
                        <>
                            {/* Badge */}
                            <div style={{
                                display: 'inline-block',
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '20px',
                                padding: '4px 14px',
                                fontSize: '12px',
                                color: '#a5b4fc',
                                marginBottom: '1rem',
                                fontWeight: 600,
                            }}>🎁 FREE FOR FOUNDERS</div>

                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                color: '#fff',
                                margin: '0 0 0.5rem',
                                lineHeight: 1.3,
                            }}>
                                Get Your Free<br />
                                <span style={{
                                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>Market Validation Report</span>
                            </h2>

                            <p style={{
                                color: '#94a3b8',
                                fontSize: '0.9rem',
                                margin: '0 0 1.5rem',
                                lineHeight: 1.5,
                            }}>
                                Revenue forecast, competitor analysis, and go-to-market strategy — delivered to your inbox in 60 seconds.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email address"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        marginBottom: '0.75rem',
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    Get My Free Report →
                                </button>
                            </form>

                            <p style={{
                                color: '#64748b',
                                fontSize: '0.75rem',
                                textAlign: 'center',
                                margin: '0.75rem 0 0',
                            }}>
                                🔒 No spam ever. Unsubscribe anytime.
                            </p>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                                You're in!
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                Check your inbox — your report is on the way.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes mvFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes mvFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>
        </>
    );
};

export default EmailCapturePopup;
