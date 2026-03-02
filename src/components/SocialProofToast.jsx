import React, { useState, useEffect } from 'react';

/**
 * 🔔 SocialProofToast — Floating notifications for real-time FOMO
 * Shows recent launches, upvotes, or "Verified" purchases.
 */
const SocialProofToast = () => {
    const [visible, setVisible] = useState(false);
    const [content, setContent] = useState(null);

    const notifications = [
        { icon: '🚀', text: 'Someone just launched "SaaS Automator" on the Launchpad!', time: '2m ago' },
        { icon: '🔥', text: '5 people just upvoted "MarketVibe"', time: 'Just now' },
        { icon: '✓', text: 'A founder just upgraded to a VERIFIED listing.', time: '1h ago' },
        { icon: '💰', text: 'New revenue report generated for "CleanSweep AI"', time: '15m ago' },
        { icon: '📈', text: 'Trending: "InvoiceFlow" reached #1 product of the day.', time: 'Just now' },
        { icon: '💎', text: 'High-ticket deal identified for a Marketing Agency idea.', time: '5m ago' },
    ];

    useEffect(() => {
        const triggerNotification = () => {
            const randomNotif = notifications[Math.floor(Math.random() * notifications.length)];
            setContent(randomNotif);
            setVisible(true);

            // Hide after 5 seconds
            setTimeout(() => {
                setVisible(false);
            }, 5000);
        };

        // Initial delay
        const initialDelay = setTimeout(triggerNotification, 10000);

        // Random intervals between 20-45 seconds
        const timer = setInterval(() => {
            triggerNotification();
        }, 30000 + Math.random() * 20000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(timer);
        };
    }, []);

    if (!content) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '12px 20px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.1)',
            transform: visible ? 'translateX(0)' : 'translateX(-120%)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            maxWidth: '320px',
            pointerEvents: 'none',
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0,
                border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
                {content.icon}
            </div>
            <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>
                    {content.text}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#6366f1', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase' }}>
                    {content.time}
                </div>
            </div>
        </div>
    );
};

export default SocialProofToast;
