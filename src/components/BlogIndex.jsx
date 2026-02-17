
import React, { useState, useEffect } from 'react';

const BlogIndex = () => {
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const modules = import.meta.glob('../content/blog/*.json', { eager: true });

            console.log("Raw Modules:", modules);

            const loadedPosts = Object.values(modules).map(mod => {
                const data = mod.default || mod;
                // Ensure data is an object
                if (typeof data !== 'object') return null;
                return data;
            }).filter(p => p !== null);

            console.log("Processed Posts:", loadedPosts);
            setPosts(loadedPosts);
        } catch (err) {
            console.error("Blog Load Error:", err);
            setError(err.message);
        }
    }, []);

    if (error) {
        return <div style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <span style={{ color: '#ec4899', fontWeight: 'bold', letterSpacing: '2px', fontSize: '0.8rem' }}>MARKET INTELLIGENCE</span>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: '1rem 0' }}>The Growth Blog 📈</h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Data-driven insights on the fastest growing niches in 2026.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {posts.map((post, index) => {
                    const safeContent = typeof post.content === 'string' ? post.content : '';
                    const excerpt = safeContent.split('\n\n')[1] || safeContent.substring(0, 100);

                    return (
                        <a href={`/blog/${post.slug || index}`} key={post.slug || index} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '1rem',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '2rem',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <span style={{
                                        background: 'rgba(236, 72, 153, 0.1)',
                                        color: '#ec4899',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {post.niche || 'Trend'}
                                    </span>
                                    <h2 style={{ fontSize: '1.5rem', color: 'white', margin: '1rem 0 0.5rem 0' }}>
                                        {post.title || 'Untitled Post'}
                                    </h2>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        {excerpt && excerpt.substring(0, 120)}...
                                    </p>
                                </div>
                                <div style={{ marginTop: '1.5rem', color: '#ec4899', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    Read Analysis ➜
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
            {posts.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
                    <p>No articles found.</p>
                </div>
            )}
        </div>
    );
};

export default BlogIndex;
