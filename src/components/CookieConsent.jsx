import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('marketvibe_cookie_consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('marketvibe_cookie_consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '600px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🍪</div>
                <div>
                    <h4 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: '700' }}>Cookie Intelligence Feed</h4>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                        We use cookies to analyze market signals and personalise your intelligence reports. Third-party vendors (like Google) use cookies to serve relevant ads based on your interests.
                    </p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <a href="/privacy" style={{ color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none', alignSelf: 'center' }}>Learn More</a>
                <button 
                    onClick={handleAccept}
                    style={{
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#4f46e5'}
                    onMouseOut={e => e.currentTarget.style.background = '#6366f1'}
                >
                    Accept Intelligence
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
