import React, { useState, useEffect } from 'react';
import AdSenseUnit from './AdSenseUnit';
import { supabase } from '../lib/supabase';

const Newsroom = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLiveNews = async () => {
            try {
                // Hacker News Firebase API is fast, free, and returns current top tech news
                const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
                const storyIds = await res.json();
                
                // Fetch details for the top 15 latest items
                const topIds = storyIds.slice(0, 15);
                const itemPromises = topIds.map(id =>
                    fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
                );
                
                const stories = await Promise.all(itemPromises);
                const filtered = stories.filter(s => s && s.url && s.title);
                setNews(filtered);
                setLoading(false);

                // --- ARCHIVE ENGINE: Upsert to Supabase ---
                if (supabase && filtered.length > 0) {
                    const archiveData = filtered.map(s => ({
                        id: s.id,
                        title: s.title,
                        url: s.url,
                        score: s.score,
                        created_at: new Date(s.time * 1000).toISOString()
                    }));
                    
                    const { error } = await supabase
                        .from('tech_archive')
                        .upsert(archiveData, { onConflict: 'id' });
                    
                    if (error) console.error('Archive Error:', error);
                    else console.log('Successfully archived', filtered.length, 'tech signals');
                }
            } catch (error) {
                console.error('Failed to fetch live tech news:', error);
                setLoading(false);
            }
        };

        fetchLiveNews();
    }, []);

    const timeAgo = (unixTimestamp) => {
        const seconds = Math.floor(Date.now() / 1000 - unixTimestamp);
        let interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>
            {/* Header Area */}
            <div style={{ background: '#fff', borderBottom: '1px solid var(--glass-border)', padding: '3rem 1.5rem', marginBottom: '2rem' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', background: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Live Feed Active
                    </div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '900', color: 'var(--text)', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
                        Top Tech News
                    </h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', lineHeight: '1.6' }}>
                        Real-time breaking tech news, startups, and product launches to help you spot emerging market trends before anyone else.
                    </p>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--primary)', fontWeight: 'bold' }}>
                        <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}>⌛</div>
                        Fetching live intelligence feeds...
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {news.map((story, index) => (
                            <React.Fragment key={story.id}>
                                <a 
                                    href={`/news/${story.id}`} 
                                    style={{ textDecoration: 'none', display: 'block' }}
                                    className="news-card"
                                >
                                    <div style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            <div style={{ 
                                                fontSize: '1.5rem', 
                                                fontWeight: '900', 
                                                color: '#e2e8f0',
                                                minWidth: '40px'
                                            }}>
                                                #{(index + 1).toString().padStart(2, '0')}
                                            </div>
                                            <div>
                                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                                                    {story.title}
                                                </h2>
                                                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{new URL(story.url).hostname.replace('www.', '')}</span>
                                                    <span>•</span>
                                                    <span>{story.score} points</span>
                                                    <span>•</span>
                                                    <span>{timeAgo(story.time)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>

                                {/* Inject AdSense after every 4th item to maximize RPM smoothly */}
                                {((index + 1) % 4 === 0) && (
                                    <div style={{ margin: '1rem 0', background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>Advertisement</div>
                                        <AdSenseUnit />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .news-card > div:hover {
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                    border-color: rgba(29, 78, 216, 0.3) !important;
                }
            `}</style>
        </div>
    );
};

export default Newsroom;
