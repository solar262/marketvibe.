import React, { useState, useEffect } from 'react';
import AdSenseUnit from './AdSenseUnit';
import { supabase } from '../lib/supabase';

const NewsArticle = () => {
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const pathParts = window.location.pathname.split('/');
        const storyId = pathParts[pathParts.length - 1];

        const fetchStory = async () => {
            try {
                const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
                let data = await res.json();
                
                // Fallback to Supabase Archive if HN item is gone
                if (!data && supabase) {
                    const { data: archived } = await supabase
                        .from('tech_archive')
                        .select('*')
                        .eq('id', storyId)
                        .single();
                    data = archived;
                }

                if (data) {
                    setStory(data);
                    document.title = `${data.title} | MarketVibe Tech News`;
                }
                setLoading(false);
            } catch (err) {
                console.error('Failed to load story', err);
                setLoading(false);
            }
        };
        fetchStory();
    }, []);

    const timeAgo = (unixTimestamp) => {
        const seconds = Math.floor(Date.now() / 1000 - unixTimestamp);
        let interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
                <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⌛</div>
            </div>
        );
    }

    if (!story) return <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text)' }}>Story not found.</div>;

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '4rem 1.5rem' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <a href="/newsroom" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2rem', display: 'inline-block' }}>
                    &larr; Back to News Feed
                </a>
                
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '900', color: 'var(--text)', marginBottom: '1.5rem', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                        {story.title}
                    </h1>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-dim)', fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                        <span>Published by <strong>{story.by}</strong></span>
                        <span>{timeAgo(story.time)}</span>
                        <span>{story.score} Market Points</span>
                    </div>

                    <div style={{ margin: '3rem 0', padding: '2rem 1rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Advertisement</div>
                        <AdSenseUnit />
                    </div>

                    <p style={{ fontSize: '1.1rem', color: 'var(--text)', lineHeight: '1.7', marginBottom: '3rem' }}>
                        MarketVibe scanners detected high activity related to <strong>{story.title}</strong>. This signal has reached a velocity score of {story.score}, making it a critical trend in the tech ecosystem. Read the full technical breakdown, comments, and details on the original source below.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                        <a 
                            href={story.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '1rem 3rem',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'transform 0.2s'
                            }}
                        >
                            Read Original Source &rarr;
                        </a>
                    </div>
                </div>

                <div style={{ margin: '4rem 0', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', textAlign: 'center' }}>Advertisement</div>
                    <AdSenseUnit />
                </div>
            </div>
        </div>
    );
};

export default NewsArticle;
