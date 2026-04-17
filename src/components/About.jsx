import React from 'react';

const About = () => {
  return (
    <div style={{ padding: '4rem 0', maxWidth: '800px', margin: '0 auto', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
        About MarketVibe
      </h1>
      
      <p style={{ fontSize: '1.25rem', lineHeight: '1.7', color: 'var(--text-dim)', marginBottom: '2.5rem' }}>
        MarketVibe is an autonomous intelligence platform designed for the next generation of founders. 
        In an era of hyper-competition, we provide the data-driven clarity needed to validate ideas, 
        size markets, and execute with precision.
      </p>

      <div style={{ display: 'grid', gap: '2rem', marginBottom: '4rem' }}>
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>Our Mission</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-dim)' }}>
            To eliminate startup failure by replacing guesswork with live market signals. 
            We believe that every founder deserves access to the same level of intelligence 
            that billion-dollar venture firms use.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>The Technology</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-dim)' }}>
            Using proprietary autonomous agents, MarketVibe scans high-intent communities on Reddit, X, 
            and deep-web forums to detect early signals of buying intent. We combine this with real-time 
            economic data to generate 30-day execution blueprints in under 60 seconds.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>Founded in 2026</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-dim)' }}>
            MarketVibe was built to address the "Information Noise" problem. In a world where AI can 
            generate a million ideas, we focus on picking the ones that actually drive revenue.
          </p>
        </section>
      </div>

      <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem' }}>Want to build something?</h3>
        <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
          Explore our <a href="/hub" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Launchpad</a> or validate your next niche today.
        </p>
      </div>
    </div>
  );
};

export default About;
