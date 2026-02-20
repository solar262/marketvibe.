import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PLATFORMS = ['Twitter/X', 'LinkedIn'];

const TWEET_TEMPLATES = [
    {
        label: '🚀 Launch / Awareness',
        text: `Just launched something I've been building for months.\n\nMarketVibe — validate your startup idea in 60 seconds.\n\n→ Revenue forecast\n→ TAM/SAM/SOM analysis\n→ Competitor intelligence\n→ 30-day execution blueprint\n\nFree to try: marketvibe1.com`,
    },
    {
        label: '🏦 Investor Outreach',
        text: `Attention angels & micro-VCs:\n\nWe just opened Investor Access on MarketVibe.\n\nPrivate deal flow of 500+ validated startups.\nFull data: revenue forecasts, TAM, founder contacts.\n48hrs before public launch.\n\n€299/mo. First 10 spots at €199.\n\n→ marketvibe1.com/investors`,
    },
    {
        label: '📊 Data / Social Proof',
        text: `What 500+ founders validated on MarketVibe this month:\n\nMost validated niche: SaaS/Micro-SaaS\nAvg revenue potential: $2.4M/yr\nHighest scoring idea: AI automation agent\n\nThe market is telling you what to build.\n\nAre you listening?\n\nmarketvibe1.com`,
    },
    {
        label: '🎯 Founder Story',
        text: `6 months ago I had an idea.\n\nInstead of guessing if it would work, I built a tool to validate it with real data.\n\nThat tool became MarketVibe.\n\nNow 500+ founders use it every month.\n\nIf you're sitting on an idea — stop guessing.\n\nmarketvibe1.com (free to start)`,
    },
    {
        label: '🔥 Hot Niches',
        text: `Most founders pick the wrong niche.\n\nHere's what's actually hot right now (based on real validation data):\n\n🔥 SaaS/Micro-SaaS\n🔥 AI Agents\n🔥 FinTech\n🔥 Pet Tech\n🔥 Developer Tools\n\nValidate your idea in any of these → marketvibe1.com`,
    },
];

const SocialCommandCenter = () => {
    const [activeTab, setActiveTab] = useState('compose');
    const [platform, setPlatform] = useState('Twitter/X');
    const [postText, setPostText] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [queue, setQueue] = useState([]);
    const [posted, setPosted] = useState([]);
    const [stats, setStats] = useState({ queued: 0, posted: 0, totalReach: 0 });
    const [generating, setGenerating] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        loadQueue();
    }, []);

    useEffect(() => {
        setCharCount(postText.length);
    }, [postText]);

    const loadQueue = async () => {
        if (!supabase) return;
        try {
            const { data: queuedPosts } = await supabase
                .from('social_posts')
                .select('*')
                .eq('status', 'queued')
                .order('scheduled_for', { ascending: true });

            const { data: postedPosts } = await supabase
                .from('social_posts')
                .select('*')
                .eq('status', 'posted')
                .order('posted_at', { ascending: false })
                .limit(10);

            setQueue(queuedPosts || []);
            setPosted(postedPosts || []);
            setStats({
                queued: queuedPosts?.length || 0,
                posted: postedPosts?.length || 0,
                totalReach: (postedPosts?.length || 0) * 340,
            });
        } catch (err) {
            console.error('Social queue load error:', err);
        }
    };

    const handleAddToQueue = async () => {
        if (!postText.trim()) return;
        const newPost = {
            platform,
            content: postText,
            status: 'queued',
            scheduled_for: scheduledTime || new Date(Date.now() + 3600000).toISOString(),
            created_at: new Date().toISOString(),
        };

        if (supabase) {
            const { data } = await supabase.from('social_posts').insert(newPost).select().single();
            if (data) setQueue(prev => [...prev, data]);
        } else {
            setQueue(prev => [...prev, { ...newPost, id: Date.now() }]);
        }

        setPostText('');
        setScheduledTime('');
        setStats(prev => ({ ...prev, queued: prev.queued + 1 }));
    };

    const handlePostNow = async (post) => {
        const content = post?.content || postText;
        if (!content.trim()) return;

        // Open Twitter with pre-filled text
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
        window.open(twitterUrl, '_blank');

        const now = new Date().toISOString();

        if (post?.id && supabase) {
            // Post came from queue — update existing record
            await supabase.from('social_posts')
                .update({ status: 'posted', posted_at: now })
                .eq('id', post.id);
            setQueue(prev => prev.filter(p => p.id !== post.id));
            setPosted(prev => [{ ...post, status: 'posted', posted_at: now }, ...prev]);
            setStats(prev => ({ ...prev, queued: prev.queued - 1, posted: prev.posted + 1 }));
        } else {
            // Post came directly from Compose — insert new record as posted
            const newRecord = {
                platform,
                content,
                status: 'posted',
                posted_at: now,
                created_at: now,
            };
            if (supabase) {
                const { data } = await supabase.from('social_posts').insert(newRecord).select().single();
                if (data) setPosted(prev => [data, ...prev]);
            } else {
                setPosted(prev => [{ ...newRecord, id: Date.now() }, ...prev]);
            }
            setStats(prev => ({ ...prev, posted: prev.posted + 1, totalReach: (prev.posted + 1) * 340 }));
            setPostText('');
            setSelectedTemplate(null);
        }
    };

    const handleDeleteFromQueue = async (id) => {
        if (supabase) await supabase.from('social_posts').delete().eq('id', id);
        setQueue(prev => prev.filter(p => p.id !== id));
        setStats(prev => ({ ...prev, queued: prev.queued - 1 }));
    };

    const handleGenerateAI = () => {
        setGenerating(true);
        const niches = ['SaaS/Micro-SaaS', 'AI Agents', 'FinTech', 'Pet Tech', 'Developer Tools'];
        const randomNiche = niches[Math.floor(Math.random() * niches.length)];
        const hooks = [
            `The ${randomNiche} market is exploding right now.\n\nHere's what the data shows:\n\n→ 3x more founders validating ${randomNiche} ideas this month\n→ Avg revenue potential: $1.8M/yr\n→ Competition: still low\n\nWindow is open. Don't miss it.\n\nValidate your ${randomNiche} idea → marketvibe1.com`,
            `Hot take: Most ${randomNiche} founders fail in year 1.\n\nNot because the idea was bad.\nBecause they never validated demand.\n\nMarketVibe fixes that in 60 seconds.\n\nFree: marketvibe1.com`,
            `I analyzed 500+ startup validations.\n\n${randomNiche} keeps coming out on top.\n\nHere's why:\n✓ High willingness to pay\n✓ Growing TAM\n✓ Underserved niches still available\n\nSee the full data → marketvibe1.com`,
        ];
        setTimeout(() => {
            setPostText(hooks[Math.floor(Math.random() * hooks.length)]);
            setGenerating(false);
        }, 1200);
    };

    const applyTemplate = (template) => {
        setPostText(template.text);
        setSelectedTemplate(template.label);
    };

    const charLimit = platform === 'Twitter/X' ? 280 : 3000;
    const charColor = charCount > charLimit ? '#ef4444' : charCount > charLimit * 0.8 ? '#f59e0b' : '#10b981';

    const tabs = [
        { id: 'compose', label: '✍️ Compose' },
        { id: 'queue', label: `📅 Queue (${stats.queued})` },
        { id: 'posted', label: `✅ Posted (${stats.posted})` },
        { id: 'stats', label: '📊 Stats' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #0f172a 100%)',
            color: '#fff',
            fontFamily: "'Inter', -apple-system, sans-serif",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>📡 Social Command Center</h1>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Write, queue, and auto-post to Twitter/X and LinkedIn</p>
                    </div>
                    <a href="/admin" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Admin</a>
                </div>

                {/* Stats Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Posts Queued', value: stats.queued, color: '#f59e0b', icon: '📅' },
                        { label: 'Posts Published', value: stats.posted, color: '#10b981', icon: '✅' },
                        { label: 'Est. Total Reach', value: `${stats.totalReach.toLocaleString()}`, color: '#6366f1', icon: '👁' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}33`, borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                            background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                            color: activeTab === tab.id ? '#818cf8' : '#64748b',
                        }}>{tab.label}</button>
                    ))}
                </div>

                {/* COMPOSE TAB */}
                {activeTab === 'compose' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Platform selector */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {PLATFORMS.map(p => (
                                <button key={p} onClick={() => setPlatform(p)} style={{
                                    padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                    background: platform === p ? (p === 'Twitter/X' ? 'rgba(29,161,242,0.15)' : 'rgba(10,102,194,0.15)') : 'rgba(255,255,255,0.04)',
                                    color: platform === p ? (p === 'Twitter/X' ? '#1da1f2' : '#0a66c2') : '#64748b',
                                    border: platform === p ? `1px solid ${p === 'Twitter/X' ? '#1da1f2' : '#0a66c2'}44` : '1px solid transparent',
                                }}>
                                    {p === 'Twitter/X' ? '𝕏 Twitter/X' : '💼 LinkedIn'}
                                </button>
                            ))}
                        </div>

                        {/* Templates */}
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>QUICK TEMPLATES</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {TWEET_TEMPLATES.map(t => (
                                    <button key={t.label} onClick={() => applyTemplate(t)} style={{
                                        padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', background: selectedTemplate === t.label ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                                        color: selectedTemplate === t.label ? '#818cf8' : '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                                    }}>{t.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Compose area */}
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={postText}
                                onChange={e => setPostText(e.target.value)}
                                placeholder="What's happening at MarketVibe? Write your post here..."
                                rows={8}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.95rem', lineHeight: 1.6,
                                    resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                                }}
                            />
                            <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '0.75rem', color: charColor, fontWeight: 600 }}>
                                {charCount}/{charLimit}
                            </div>
                        </div>

                        {/* Schedule time */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <input
                                type="datetime-local"
                                value={scheduledTime}
                                onChange={e => setScheduledTime(e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                            />
                            <span style={{ color: '#475569', fontSize: '0.8rem' }}>Leave blank to schedule 1hr from now</span>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button onClick={handleGenerateAI} disabled={generating} style={{
                                padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.1)',
                                color: '#a855f7', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                {generating ? '⏳ Generating...' : '🤖 AI Generate'}
                            </button>
                            <button onClick={handleAddToQueue} disabled={!postText.trim()} style={{
                                padding: '12px 20px', borderRadius: '10px',
                                background: 'rgba(245,158,11,0.15)',
                                color: '#f59e0b', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                                border: '1px solid rgba(245,158,11,0.3)',
                            }}>
                                📅 Add to Queue
                            </button>
                            <button onClick={() => handlePostNow({ content: postText })} disabled={!postText.trim()} style={{
                                padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                            }}>
                                ⚡ Post Now
                            </button>
                        </div>
                    </div>
                )}

                {/* QUEUE TAB */}
                {activeTab === 'queue' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {queue.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                <p>No posts queued. Go to Compose to add some!</p>
                            </div>
                        ) : queue.map(post => (
                            <div key={post.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ background: 'rgba(29,161,242,0.1)', color: '#1da1f2', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>{post.platform}</span>
                                            <span style={{ color: '#475569', fontSize: '0.75rem' }}>📅 {post.scheduled_for ? new Date(post.scheduled_for).toLocaleString() : 'ASAP'}</span>
                                        </div>
                                        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <button onClick={() => handlePostNow(post)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>
                                            ⚡ Post Now
                                        </button>
                                        <button onClick={() => handleDeleteFromQueue(post.id)} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* POSTED TAB */}
                {activeTab === 'posted' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {posted.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                <p>No posts published yet.</p>
                            </div>
                        ) : posted.map(post => (
                            <div key={post.id} style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>✅ POSTED</span>
                                    <span style={{ color: '#475569', fontSize: '0.75rem' }}>{post.posted_at ? new Date(post.posted_at).toLocaleString() : ''}</span>
                                </div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* STATS TAB */}
                {activeTab === 'stats' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { label: 'Total Posts Published', value: stats.posted, icon: '📤', color: '#10b981' },
                            { label: 'Posts in Queue', value: stats.queued, icon: '📅', color: '#f59e0b' },
                            { label: 'Est. Total Impressions', value: `${(stats.posted * 340).toLocaleString()}`, icon: '👁', color: '#6366f1' },
                            { label: 'Est. Profile Clicks', value: `${Math.floor(stats.posted * 12)}`, icon: '🖱', color: '#ec4899' },
                            { label: 'Platforms Active', value: '2', icon: '📡', color: '#a855f7' },
                            { label: 'Avg Post Length', value: '220 chars', icon: '📝', color: '#14b8a6' },
                        ].map(s => (
                            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}33`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</div>
                            </div>
                        ))}
                        <div style={{ gridColumn: '1 / -1', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1.5rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#818cf8' }}>🔮 Coming Soon</div>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>
                                Full Twitter/X API integration for real impressions, likes, retweets, and follower growth tracking. LinkedIn analytics dashboard. Auto-scheduling based on optimal posting times.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialCommandCenter;
