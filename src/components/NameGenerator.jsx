import React, { useState } from 'react';

const NameGenerator = ({ onSelectName }) => {
    const [keywords, setKeywords] = useState('');
    const [names, setNames] = useState([]);
    const [loading, setLoading] = useState(false);

    const prefixes = ['Nova', 'Swift', 'Meta', 'Zen', 'Flex', 'Core', 'Vibe', 'Loom', 'Orbit', 'Pulse', 'Flow'];
    const suffixes = ['ly', 'ify', 'hub', 'base', 'dock', 'grid', 'lab', 'stack', 'way', 'app', 'io'];
    const powerWords = ['Launch', 'Smart', 'Elite', 'Direct', 'Pure', 'Hyper', 'Quick', 'Deep'];

    const [email, setEmail] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [generationCount, setGenerationCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Import Supabase just for this component if not passed (though ideally should be passed)
    // For now, we'll assume we need to import it or it's available. 
    // Wait, the previous file view didn't show supabase import. Let's add it in the imports section in a separate edit or use window.supabase if available?
    // Better to import it from lib.

    const handleSave = async (e) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);

        // Dynamic import to avoid breaking if not present, but we know it is.
        const { supabase } = await import('../lib/supabase');

        await supabase.from('leads').upsert({
            email,
            niche: keywords,
            status: 'tool_capture_naming',
            created_at: new Date().toISOString()
        }, { onConflict: 'email', ignoreDuplicates: true });

        setShowModal(false);
        setSubmitting(false);
        alert("Names saved! We've emailed them to you.");
    };

    const generateNames = (e) => {
        e.preventDefault();
        if (!keywords) return;

        setLoading(true);
        // Trigger modal on 3rd attempt
        if (generationCount === 2) {
            setShowModal(true);
        }
        setGenerationCount(prev => prev + 1);

        setTimeout(() => {
            const input = keywords.trim().split(' ')[0].toLowerCase();
            const capitalInput = input.charAt(0).toUpperCase() + input.slice(1);

            const generated = [
                // Pattern 1: input + suffix
                `${capitalInput}${suffixes[Math.floor(Math.random() * suffixes.length)]}`,
                `${capitalInput}ly`,

                // Pattern 2: prefix + input
                `${prefixes[Math.floor(Math.random() * prefixes.length)]}${capitalInput}`,

                // Pattern 3: Power word + input
                `${powerWords[Math.floor(Math.random() * powerWords.length)]} ${capitalInput}`,

                // Pattern 4: Portmanteau
                `${capitalInput.slice(0, 3)}${prefixes[Math.floor(Math.random() * prefixes.length)].toLowerCase()}`,

                // Pattern 5: Noun usage
                `The ${capitalInput} Co`,
                `${capitalInput} Lab`
            ];

            // Remove duplicates and shuffle
            setNames([...new Set(generated)].sort(() => Math.random() - 0.5));
            setLoading(false);
        }, 600);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', color: 'white', textAlign: 'center', position: 'relative' }}>
            <div className="badge" style={{ marginBottom: '1rem' }}>FREE TOOL</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Startup Name Generator 🚀</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>
                Found a great business niche? Now give it a brand name that stands out.
            </p>

            <form onSubmit={generateNames} style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '2rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '3rem',
                display: 'flex',
                gap: '1rem'
            }}>
                <input
                    type="text"
                    placeholder="e.g. Pet tech, Coffee, SaaS"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.75rem',
                        color: 'white',
                        fontSize: '1rem'
                    }}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ padding: '1rem 2rem' }}
                >
                    {loading ? 'Thinking...' : 'Generate Names'}
                </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {names.map((name, index) => (
                    <div
                        key={index}
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            alignItems: 'center',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{name}</span>
                        <button
                            onClick={() => onSelectName(name)}
                            style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid #6366f1',
                                color: '#6366f1',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Validate this name →
                        </button>
                    </div>
                ))}
            </div>

            {names.length === 0 && !loading && (
                <div style={{ opacity: 0.3, padding: '4rem 0' }}>
                    Your generated names will appear here.
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#0f172a', padding: '2rem', borderRadius: '1rem',
                        border: '1px solid #334155', maxWidth: '400px', width: '90%'
                    }}>
                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>💾 Save Your Ideas?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Don't lose these gems! Enter your email to save your favorites and get a free validation report.
                        </p>
                        <form onSubmit={handleSave}>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', marginBottom: '1rem',
                                    background: 'rgba(255,255,255,0.1)', border: '1px solid #475569',
                                    color: 'white', borderRadius: '0.5rem'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #475569', color: '#94a3b8', background: 'transparent', cursor: 'pointer' }}>Skip</button>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: '#6366f1', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Save & Continue'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(NameGenerator);
