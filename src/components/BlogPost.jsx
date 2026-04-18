
import React, { useState, useEffect } from 'react';
import AdSenseUnit from './AdSenseUnit';

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
                    const data = mod.default || mod;
                    setPost(data);

                    // --- SEO/AEO Dynamic Injection ---
                    document.title = `${data.title} | MarketVibe Analysis`;

                    // Update meta tags manually since utility is in App.jsx
                    const updateMeta = (name, value) => {
                        let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
                        if (el) el.setAttribute('content', value);
                    };
                    updateMeta('description', data.content.substring(0, 160).replace(/[#*]/g, ''));
                    updateMeta('og:title', data.title);
                    updateMeta('og:description', data.content.substring(0, 160).replace(/[#*]/g, ''));

                    // Inject LD+JSON for AEO
                    const schema = {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": data.title,
                        "datePublished": data.date,
                        "author": {
                            "@type": "Person",
                            "name": data.author
                        },
                        "description": data.content.substring(0, 200).replace(/[#*]/g, ''),
                        "publisher": {
                            "@type": "Organization",
                            "name": "MarketVibe",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://www.marketvibe1.com/logo.svg"
                            }
                        }
                    };

                    let script = document.getElementById('blog-schema');
                    if (!script) {
                        script = document.createElement('script');
                        script.id = 'blog-schema';
                        script.type = 'application/ld+json';
                        document.head.appendChild(script);
                    }
                    script.text = JSON.stringify(schema);

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

        return () => {
            const script = document.getElementById('blog-schema');
            if (script) script.remove();
        };
    }, [slug]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '4rem' }}>Loading article...</div>;
    if (!post) return <div style={{ color: 'white', textAlign: 'center', padding: '4rem' }}>Article not found.</div>;

    // Simple Markdown Parser (Headers, Bold, Links) with Ad Injection
    const renderContent = (text) => {
        const lines = text.split('\n');
        let paragraphCount = 0;
        
        return lines.map((line, i) => {
            if (!line.trim()) return null;

            if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '2.5rem', marginTop: '2rem', marginBottom: '1rem', color: 'white' }}>{line.replace('# ', '')}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.8rem', marginTop: '2rem', marginBottom: '1rem', color: '#ec4899' }}>{line.replace('## ', '')}</h2>;
            if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>{line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>;

            // Increment paragraph count for text lines
            paragraphCount++;

            // Paragraphs with bold and links
            let content = line;

            // [Existing logic for bold, email capture, etc. - simplified for replacement]
            // We want to return the paragraph AND possibly an ad after it
            
            let element = null;
            if (content.includes('trigger_email_capture')) {
                 // ... [Email capture logic]
            } else if (content.includes('[**Validate Your')) {
                 // ... [Validate logic]
            } else {
                element = <p key={i} style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e2e8f0', marginBottom: '1rem' }}>{line}</p>;
            }
            
            // Inject Ad Sense after 3rd paragraph
            if (paragraphCount === 3) {
                return (
                    <React.Fragment key={i}>
                        {element || <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e2e8f0', marginBottom: '1rem' }}>{line}</p>}
                        <div style={{ margin: '3rem 0', textAlign: 'center' }}>
                             <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>Market Intelligence Report</div>
                             <AdSenseUnit style={{ display: 'block', textAlign: 'center' }} />
                        </div>
                    </React.Fragment>
                );
            }

            return element || <p key={i} style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e2e8f0', marginBottom: '1rem' }}>{line}</p>;
        });
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(0, 800px) 300px', 
                gap: '4rem',
                alignItems: 'start' 
            }} className="blog-layout-grid">
                
                {/* Main Content */}
                <article style={{ color: 'white' }}>
                    <nav style={{ marginBottom: '2rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                         <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</a>
                         <span style={{ margin: '0 0.5rem' }}>/</span>
                         <a href="/blog" style={{ color: '#94a3b8', textDecoration: 'none' }}>Intelligence Blog</a>
                         <span style={{ margin: '0 0.5rem' }}>/</span>
                         <span style={{ color: '#ec4899' }}>Analysis</span>
                    </nav>

                    <div style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{post.date} • {post.author}</span>
                        <h1 style={{ fontSize: '3rem', fontWeight: '900', margin: '1rem 0' }}>{post.title}</h1>
                        <div style={{ display: 'inline-block', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.25rem 1rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            Trending: {post.niche}
                        </div>
                    </div>

                    <AdSenseUnit style={{ marginBottom: '2rem' }} />

                    <div className="blog-content">
                        {/* google_ad_section_start */}
                        {renderContent(post.content)}
                        {/* google_ad_section_end */}
                    </div>

                    <AdSenseUnit style={{ marginTop: '2rem' }} />

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

                {/* Sticky Sidebar Ad (Desktop Only) */}
                <aside className="sidebar-ad-desktop" style={{ display: window.innerWidth < 1024 ? 'none' : 'block' }}>
                    <SidebarAd />
                    
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: 'white', marginTop: 0, fontSize: '1rem' }}>Latest Signals</h4>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            Scanners currently picking up high activity in <b>Solana DeFi</b> and <b>Sustainable Micro-SaaS</b>.
                        </div>
                    </div>
                </aside>
            </div>

            {/* Multiplex Recommendations */}
            <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '0.1em' }}>Intelligence Feed: Recommended Readings</div>
                <AdSenseUnit slot="2948048414" format="autorelaxed" />
            </div>
        </div>
    );
};

export default BlogPost;
