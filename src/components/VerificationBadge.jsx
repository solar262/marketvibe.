import React from 'react';

const VerificationBadge = ({ score, leadId }) => {
    const badgeLink = `https://www.marketvibe1.com/og-preview/${leadId}?ref=badge&lid=${leadId}`;

    return (
        <a
            href={badgeLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                textDecoration: 'none',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s, border-color 0.2s'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.8)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            }}
        >
            <div style={{
                width: '32px',
                height: '32px',
                background: '#6366f1',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '0.8rem'
            }}>
                MV
            </div>
            <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Idea Validated
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Score: <span style={{ color: '#6366f1' }}>{score}/10</span>
                </div>
            </div>
            <div style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                🛡️
            </div>
        </a>
    );
};

export default VerificationBadge;
