import React, { useState } from 'react';
import { popularNiches } from '../lib/niches';

const Library = ({ onSelectNiche }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    const categories = ['All', 'SaaS', 'Tech', 'Services', 'Retail', 'AI'];

    const filteredNiches = popularNiches.filter(n => {
        const matchesSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div style={{ padding: '4rem 1rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <span style={{ color: '#6366f1', fontWeight: 'bold', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                    Market Intelligence Vault
                </span>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                    fontWeight: '900',
                    margin: '1.5rem 0',
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(to right, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    The Validation <span style={{ color: '#6366f1', WebkitTextFillColor: 'initial' }}>Library</span>
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
                    Browse through hundreds of AI-generated market blueprints. Each industry is analyzed for entry barriers, revenue potential, and execution risk.
                </p>
            </div>

            {/* Search & Filter Bar */}
            <div style={{
                marginBottom: '3rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                background: 'rgba(255,255,255,0.02)',
                padding: '1.5rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
            }}>
                <input
                    type="text"
                    placeholder="Search industries (e.g. 'AI', 'Pet', 'SaaS')..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.75rem',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none',
                        minWidth: '250px'
                    }}
                />
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {filteredNiches.map((niche, idx) => (
                    <div
                        key={idx}
                        onClick={() => onSelectNiche(niche)}
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '2rem',
                            borderRadius: '1.25rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#6366f1',
                                fontWeight: 'bold'
                            }}>
                                {niche.name.charAt(0)}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase' }}>Available</span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>{niche.name}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            {niche.description}
                        </p>
                        <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 'bold' }}>
                            View Intelligence Report ➜
                        </div>
                    </div>
                ))}
            </div>

            {filteredNiches.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
                    <p>No industry blueprints found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default Library;
