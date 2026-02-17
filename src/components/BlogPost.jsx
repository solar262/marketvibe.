
import React, { useState, useEffect } from 'react';


const BlogPost = () => {
    // Manual slug extraction since we are not using React Router's <Route>
    const slug = window.location.pathname.split('/').pop();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPost = async () => {
            try {
                // Vite glob import for dynamic loading
                const modules = import.meta.glob('../content/blog/*.json');
                const path = `../content/blog/${slug}.json`;

                if (modules[path]) {
                    const mod = await modules[path]();
                    setPost(mod.default || mod);
                } else {
                    console.error("Post not found:", path);
                }
            } catch (err) {
                console.error("Failed to load blog post", err);
            } finally {
                setLoading(false);
            }
        };
        loadPost();
    }, [slug]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '4rem' }}>Loading article...</div>;
    if (!post) return <div style={{ color: 'white', textAlign: 'center', padding: '4rem' }}>Article not found.</div>;

    // Simple Markdown Parser (Headers, Bold, Links)
    const renderContent = (text) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '2.5rem', marginTop: '2rem', marginBottom: '1rem', color: 'white' }}>{line.replace('# ', '')}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.8rem', marginTop: '2rem', marginBottom: '1rem', color: '#ec4899' }}>{line.replace('## ', '')}</h2>;
            if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>{line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>;

            // Paragraphs with bold and links
            let content = line;

            // Bold
            const boldParts = content.split(/\*\*(.*?)\*\*/g);
            if (boldParts.length > 1) {
                return (
                    <p key={i} style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e2e8f0', marginBottom: '1rem' }}>
                        {boldParts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'white' }}>{part}</strong> : part)}
                    </p>
                );
            }

            // Link (Simple check for the CTA at the end)
            if (content.includes('[**Validate Your')) {
                const url = content.match(/\((.*?)\)/)[1];
                const text = content.match(/\[\*\*(.*?)\*\*\]/)[1];
                return (
                    <div key={i} style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <a href={url.replace('/validate/', '/validate/')} style={{
                            background: '#ec4899',
                            color: 'white',
                            padding: '1rem 2rem',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            display: 'inline-block',
                            boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.39)'
                        }}>
                            {text}
                        </a>
                    </div>
                );
            }

            return <p key={i} style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e2e8f0', marginBottom: '1rem' }}>{line}</p>;
        });
    };

    return (
        <article style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', color: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{post.date} • {post.author}</span>
                <h1 style={{ fontSize: '3rem', fontWeight: '900', margin: '1rem 0' }}>{post.title}</h1>
                <div style={{ display: 'inline-block', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.25rem 1rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Trending: {post.niche}
                </div>
            </div>

            <div className="blog-content">
                {renderContent(post.content)}
            </div>

            {/* Permanent CTA Footer */}
            <div style={{ marginTop: '4rem', padding: '3rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', border: '1px solid rgba(99, 102, 241, 0.3)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>Build a Business in {post.niche}</h3>
                <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
                    Don't just read about trends—act on them. Validate your idea in seconds.
                </p>
                <a href={`/validate/${post.slug}`} style={{
                    background: '#6366f1',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    display: 'inline-block',
                    boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
                    transition: 'transform 0.2s'
                }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Launch Validation Project 🚀
                </a>
            </div>
        </article>
    );
};

export default BlogPost;
