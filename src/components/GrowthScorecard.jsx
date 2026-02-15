import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const GrowthScorecard = ({ leadId }) => {
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLead = async () => {
            const { data, error } = await supabase
                .from('growth_leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (!error) setLead(data);
            setLoading(false);
        };
        fetchLead();
    }, [leadId]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '10rem' }}>Generating Social Scorecard...</div>;
    if (!lead) return <div style={{ color: 'white', textAlign: 'center', padding: '10rem' }}>Lead not found.</div>;

    const report = lead.teaser_report;

    return (
        <div style={{
            width: '1200px',
            height: '630px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            padding: '4rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Accents */}
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', background: 'rgba(236, 72, 153, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

            <div style={{ zIndex: 1, textAlign: 'center', width: '100%' }}>
                <span style={{ background: '#6366f1', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '2rem', display: 'inline-block' }}>
                    MARKETVIBE VALIDATION
                </span>

                <h1 style={{ fontSize: '5rem', margin: '1rem 0', fontWeight: '900', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {lead.niche}
                </h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem', width: '100%', maxWidth: '900px', margin: '3rem auto' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ color: '#94a3b8', fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Est. Year 1 Revenue</p>
                        <h2 style={{ fontSize: '4rem', margin: 0, color: '#10b981' }}>${report.revenueForecast.estimatedAnnualRevenue}</h2>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ color: '#94a3b8', fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Market Opportunity</p>
                        <h2 style={{ fontSize: '4rem', margin: 0, color: '#6366f1' }}>{report.revenueForecast.marketSize}</h2>
                    </div>
                </div>

                <p style={{ fontSize: '1.5rem', color: '#64748b', marginTop: '2rem' }}>
                    Validated idea for <span style={{ color: '#fff' }}>@{lead.username}</span> on Reddit
                </p>
            </div>

            <div style={{ position: 'absolute', bottom: '2rem', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>
                Generate your blueprint at marketvibe.vercel.app
            </div>
        </div>
    );
};

export default GrowthScorecard;
