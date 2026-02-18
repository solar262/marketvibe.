import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState({
        visitors: 0,
        leads: 0,
        conversionRate: 0,
        loading: true
    });
    const [recentLeads, setRecentLeads] = useState([]);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            // 1. Get Visitors
            const { data: traffic } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'website_hits')
                .single();

            // 2. Get Total Leads
            const { count: totalLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            // 3. Get Recent "Unicorns" (>$1M) or just high scores
            const { data: leads } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            const visitors = traffic?.value || 0;
            const leadsCount = totalLeads || 0;
            const conversion = visitors > 0 ? ((leadsCount / visitors) * 100).toFixed(1) : 0;

            setMetrics({
                visitors,
                leads: leadsCount,
                conversionRate: conversion,
                loading: false
            });
            setRecentLeads(leads || []);

        } catch (error) {
            console.error('Dashboard Error:', error);
            // Ensure we stop loading even on error
            setMetrics(prev => ({ ...prev, loading: false }));
        }
    };

    if (metrics.loading) return (
        <div style={{ color: 'white', padding: '4rem', textAlign: 'center', minHeight: '100vh', background: '#0f172a' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📡</div>
            <h2>Establishing Uplink...</h2>
            <p style={{ color: '#94a3b8' }}>Contacting Lead Database</p>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f172a',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem', borderBottom: '1px solid #334155', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🚀 MarketVibe Command Center</h1>
                        <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Real-time Growth Telemetry</p>
                    </div>
                    <a href="/" style={{ color: '#6366f1', textDecoration: 'none' }}>← Back to App</a>
                </header>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <MetricCard
                        label="Website Visitors"
                        value={metrics.visitors}
                        change="+Since Launch"
                        color="#6366f1"
                        icon="🌍"
                    />
                    <MetricCard
                        label="Total Leads"
                        value={metrics.leads}
                        change="Since Launch"
                        color="#10b981"
                        icon="👥"
                    />
                    <MetricCard
                        label="Conversion Rate"
                        value={`${metrics.conversionRate}%`}
                        change="Target: 5%"
                        color={metrics.conversionRate > 5 ? '#10b981' : '#f59e0b'}
                        icon="📈"
                    />
                    <MetricCard
                        label="Social Activity"
                        value="Active"
                        change="Bot Running"
                        color="#ec4899"
                        icon="🤖"
                    />
                </div>

                {/* Navigation to Sub-modules */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                    <a href="/admin/leads" style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '2rem', borderRadius: '1rem', border: '1px solid #6366f1', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                            <h3 style={{ color: 'white', margin: 0 }}>Sales Bot</h3>
                            <p style={{ color: '#94a3b8' }}>Send High-Ticket DMs</p>
                        </div>
                    </a>
                    <a href="/newsroom" style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '2rem', borderRadius: '1rem', border: '1px solid #ec4899', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
                            <h3 style={{ color: 'white', margin: 0 }}>Newsroom</h3>
                            <p style={{ color: '#94a3b8' }}>Trend Intelligence</p>
                        </div>
                    </a>
                    <a href="/blog" style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2rem', borderRadius: '1rem', border: '1px solid #10b981', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
                            <h3 style={{ color: 'white', margin: 0 }}>Auto-Blog</h3>
                            <p style={{ color: '#94a3b8' }}>SEO Content Engine</p>
                        </div>
                    </a>
                    <a href="/admin/social" style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '2rem', borderRadius: '1rem', border: '1px solid #a855f7', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
                            <h3 style={{ color: 'white', margin: 0 }}>Social HQ</h3>
                            <p style={{ color: '#94a3b8' }}>Post · Queue · Automate</p>
                        </div>
                    </a>

                </div>

                {/* Recent Validations Table */}
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>💎 Recent Validations</h2>
                <div style={{ background: '#1e293b', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #334155' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#334155', color: '#cbd5e1' }}>
                                <th style={{ padding: '1rem' }}>Project Name</th>
                                <th style={{ padding: '1rem' }}>Niche</th>
                                <th style={{ padding: '1rem' }}>Revenue Forecast</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLeads.map(lead => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{lead.project_name || 'Untitled'}</td>
                                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{lead.results?.niche || 'General'}</td>
                                    <td style={{ padding: '1rem', color: '#10b981' }}>
                                        {lead.results?.revenueForecast?.estimatedAnnualRevenue ? `$${lead.results.revenueForecast.estimatedAnnualRevenue}` : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: lead.status === 'completed_validation' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                            color: lead.status === 'completed_validation' ? '#34d399' : '#fbbf24',
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem'
                                        }}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(lead.created_at).toLocaleTimeString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, change, color, icon }) => (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '1rem', border: `1px solid ${color}33`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.05 }}>{icon}</div>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{label}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{value}</div>
        <div style={{ color, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>{icon}</span> {change}
        </div>
    </div>
);

export default AdminDashboard;
