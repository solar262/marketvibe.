import React, { useState, useEffect } from 'react';

const TwitterBotDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ follows: 0, replies: 0, runs: 0, errors: 0 });
    const [recentFollows, setRecentFollows] = useState([]);
    const [recentReplies, setRecentReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [botRunning, setBotRunning] = useState(false);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            // Try to fetch log file from public directory
            const res = await fetch('/twitter_bot_log.json');
            if (res.ok) {
                const data = await res.json();
                processLogs(data);
            } else {
                // If file doesn't exist yet, show instructions
                setLogs([]);
                setStats({ follows: 0, replies: 0, runs: 0, errors: 0 });
            }
        } catch {
            // Ignore fetch errors
        }
        setLoading(false);
        setLastUpdated(new Date());
    };

    const processLogs = (data) => {
        if (!Array.isArray(data)) return;
        setLogs(data.slice(-50).reverse());

        const follows = data.filter(l => l.message?.includes('✅ Followed')).length;
        const replies = data.filter(l => l.message?.includes('💬 Replied')).length;
        const runs = data.filter(l => l.message?.includes('Run complete')).length;
        const errors = data.filter(l => l.message?.includes('❌') || l.message?.includes('Error')).length;

        setStats({ follows, replies, runs, errors });

        setRecentFollows(
            data.filter(l => l.message?.includes('✅ Followed'))
                .slice(-10)
                .reverse()
                .map(l => ({ time: l.time, url: l.url || 'Unknown profile' }))
        );

        setRecentReplies(
            data.filter(l => l.message?.includes('💬 Replied'))
                .slice(-5)
                .reverse()
                .map(l => ({ time: l.time }))
        );

        // Bot is "running" if last log was within 20 minutes
        if (data.length > 0) {
            const lastLog = new Date(data[data.length - 1].time);
            setBotRunning((Date.now() - lastLog.getTime()) < 20 * 60 * 1000);
        }
    };

    const timeAgo = (isoString) => {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        if (hrs > 0) return `${hrs}h ago`;
        if (mins > 0) return `${mins}m ago`;
        return 'just now';
    };

    const getLogColor = (message) => {
        if (message?.includes('✅')) return '#10b981';
        if (message?.includes('💬')) return '#6366f1';
        if (message?.includes('❌') || message?.includes('Error')) return '#ef4444';
        if (message?.includes('🔍')) return '#f59e0b';
        if (message?.includes('🚀')) return '#a855f7';
        return '#64748b';
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐦</div>
                <p>Loading Twitter Bot data...</p>
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #0f172a 100%)',
            color: '#fff',
            fontFamily: "'Inter', -apple-system, sans-serif",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>🐦 Twitter Growth Bot</h1>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                            Auto-follows investors & VCs · Replies with MarketVibe
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: botRunning ? '#10b981' : '#475569',
                                boxShadow: botRunning ? '0 0 8px #10b981' : 'none',
                            }} />
                            <span style={{ fontSize: '0.8rem', color: botRunning ? '#10b981' : '#475569' }}>
                                {botRunning ? 'Bot Active' : 'Bot Idle'}
                            </span>
                        </div>
                        <a href="/admin" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>← Admin</a>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Follows', value: stats.follows, icon: '➕', color: '#10b981' },
                        { label: 'Replies Sent', value: stats.replies, icon: '💬', color: '#6366f1' },
                        { label: 'Bot Runs', value: stats.runs, icon: '🔄', color: '#f59e0b' },
                        { label: 'Errors', value: stats.errors, icon: '⚠️', color: stats.errors > 0 ? '#ef4444' : '#475569' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${s.color}33`,
                            borderRadius: '12px', padding: '1.25rem', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* How to run */}
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
                    <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '0.75rem' }}>🚀 How to Run the Bot</div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#10b981' }}>
                            node twitter_growth_bot.mjs
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#f59e0b' }}>
                            node twitter_growth_bot.mjs --scheduled
                        </div>
                    </div>
                    <p style={{ margin: '0.75rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                        Follows 10 investors/VCs per run · Replies to 2 tweets · Logs everything below
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Recent Follows */}
                    <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '1rem', fontSize: '0.9rem' }}>➕ Recent Follows</div>
                        {recentFollows.length === 0 ? (
                            <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>No follows yet. Run the bot to start.</p>
                        ) : recentFollows.map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                    {f.url?.replace('https://x.com/', '@') || '@unknown'}
                                </span>
                                <span style={{ color: '#475569', fontSize: '0.75rem' }}>{timeAgo(f.time)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Recent Replies */}
                    <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '1rem', fontSize: '0.9rem' }}>💬 Recent Replies</div>
                        {recentReplies.length === 0 ? (
                            <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>No replies yet. Bot replies to 2 tweets per run.</p>
                        ) : recentReplies.map((r, i) => (
                            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>MarketVibe investor reply sent</div>
                                <div style={{ color: '#475569', fontSize: '0.75rem' }}>{timeAgo(r.time)}</div>
                            </div>
                        ))}
                        <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Reply template used:</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                "For angels looking for early validated deals — we just launched a private feed at marketvibe1.com/investors 🚀"
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>📋 Activity Log</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                            {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : ''}
                            {' · '}
                            <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={fetchLogs}>Refresh</span>
                        </div>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {logs.map((entry, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ color: '#334155', minWidth: '80px', flexShrink: 0 }}>
                                    {new Date(entry.time).toLocaleTimeString()}
                                </span>
                                <span style={{ color: getLogColor(entry.message) }}>
                                    {entry.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Last updated */}
                {lastUpdated && (
                    <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '1rem' }}>
                        Auto-refreshes every 15 seconds
                    </p>
                )}
            </div>
        </div>
    );
};

export default TwitterBotDashboard;
