
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BlogIndex = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        // Vite glob import to load all blog JSONs
        const modules = import.meta.glob('../content/blog/*.json', { eager: true });

        const loadedPosts = Object.values(modules).map(mod => mod.default || mod);
        setPosts(loadedPosts);
    }, []);

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
                {posts.map((post) => (
                    <Link to={`/blog/${post.slug}`} key={post.slug} style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '1rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '2rem',
                            height: '100%',
                            transition: 'transform 0.2s, border-color 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            }}
                        >
                            <div>
                                <span style={{
                                    background: 'rgba(236, 72, 153, 0.1)',
                                    color: '#ec4899',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                }}>
                                    {post.niche}
                                </span>
                                <h2 style={{ fontSize: '1.5rem', color: 'white', margin: '1rem 0 0.5rem 0' }}>
                                    {post.title}
                                </h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    {post.content.split('\n\n')[1].substring(0, 120)}...
                                </p>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ec4899', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                Read Analysis ➜
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BlogIndex;
