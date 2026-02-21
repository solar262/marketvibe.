import React from 'react';

/**
 * 🚀 LaunchpadCard — single product listing card
 * Shows product name, tagline, upvotes, tier badge, and niche tag.
 */
const LaunchpadCard = ({ listing, onUpvote }) => {
    const tierStyles = {
        featured: {
            border: '2px solid #f59e0b',
            badge: '⭐ FEATURED',
            badgeBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
            glow: '0 0 25px rgba(245, 158, 11, 0.2)',
            premiumClass: 'featured-shine'
        },
        validated: {
            border: '2px solid #a855f7',
            badge: '✓ VERIFIED',
            badgeBg: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            glow: '0 0 25px rgba(168, 85, 247, 0.2)',
            premiumClass: 'premium-shine'
        },
        free: {
            border: '1px solid rgba(255,255,255,0.08)',
            badge: null,
            badgeBg: null,
            glow: 'none',
            premiumClass: ''
        },
    };

    const tier = tierStyles[listing.tier] || tierStyles.free;
    const hasVoted = localStorage.getItem(`lp_voted_${listing.id}`);

    const handleUpvote = (e) => {
        e.stopPropagation();
        if (hasVoted) return;
        localStorage.setItem(`lp_voted_${listing.id}`, 'true');
        if (onUpvote) onUpvote(listing.id);
    };

    const nicheColors = {
        'SaaS': '#6366f1', 'AI': '#a855f7', 'FinTech': '#10b981',
        'E-commerce': '#f59e0b', 'Health': '#ef4444', 'Education': '#3b82f6',
        'Marketing': '#ec4899', 'Developer Tools': '#14b8a6',
    };

    const nicheColor = nicheColors[listing.niche] || '#6366f1';

    const getLogo = () => {
        if (listing.logo_url) return <img src={listing.logo_url} alt={listing.name} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />;

        // Premium Mapping for Featured/Verified Startups
        const logoMap = {
            'ContentFlow AI': '🌊',
            'DevHealth Monitor': '🩺',
            'CryptoTax Solver': '🪙',
            'AlphaBot Pro': '🤖',
            'InvoiceSnap': '📸',
            'NicheHunt': '🎯',
            'LeadSentinel': '🛡️',
            'SparkScribe': '✍️',
            'Invoice flow': '📊'
        };

        const nicheIconMap = {
            'SaaS': '☁️', 'AI': '🧠', 'FinTech': '💳',
            'E-commerce': '🛒', 'Health': '🏥', 'Education': '🎓',
            'Marketing': '📢', 'Developer Tools': '🛠️'
        };

        const icon = logoMap[listing.name] || nicheIconMap[listing.niche] || '🚀';

        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
            }}>
                {icon}
            </div>
        );
    };

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: tier.border,
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            transition: 'all 0.25s ease',
            boxShadow: tier.glow,
            cursor: 'pointer',
            position: 'relative',
        }}
            className={tier.premiumClass}
            onClick={() => { window.location.href = `/launchpad/listing/${listing.id}`; }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = tier.glow;
            }}
        >
            {/* Upvote */}
            <div
                onClick={handleUpvote}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '50px',
                    padding: '0.5rem',
                    borderRadius: '12px',
                    background: hasVoted ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: hasVoted ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                    cursor: hasVoted ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <span style={{
                    fontSize: '1.2rem',
                    color: hasVoted ? '#6366f1' : '#64748b',
                    transform: hasVoted ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                }}>▲</span>
                <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: hasVoted ? '#6366f1' : '#94a3b8',
                }}>{listing.upvotes}</span>
            </div>

            {/* Product Logo / Graphic */}
            <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${nicheColor}44, ${nicheColor}11)`,
                border: `1px solid ${nicheColor}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 15px ${nicheColor}22`,
                overflow: 'hidden',
                position: 'relative'
            }}>
                {getLogo()}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>{listing.name}</h3>

                    {tier.badge && (
                        <span style={{
                            background: tier.badgeBg,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>{tier.badge}</span>
                    )}
                </div>

                <p style={{
                    margin: '4px 0 8px',
                    fontSize: '0.88rem',
                    color: '#94a3b8',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>{listing.tagline}</p>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                        background: `${nicheColor}22`,
                        color: nicheColor,
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        border: `1px solid ${nicheColor}33`,
                    }}>{listing.niche}</span>

                    {listing.revenue_potential && (
                        <span style={{
                            color: '#10b981',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                        }}>💰 {listing.revenue_potential}</span>
                    )}

                    <span style={{
                        color: '#475569',
                        fontSize: '0.72rem',
                        marginLeft: 'auto',
                    }}>by {listing.founder_name}</span>
                </div>
            </div>

            {/* External link */}
            {listing.url && (
                <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = 'rgba(99, 102, 241, 0.2)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                    }}
                >Visit →</a>
            )}
        </div>
    );
};

export default LaunchpadCard;
