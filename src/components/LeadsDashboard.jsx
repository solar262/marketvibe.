import React, { useState, useEffect, memo } from 'react';
import { supabase } from '../lib/supabase';

const LeadsDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'qualified', 'contacted', 'closed', 'rejected'
    const [stats, setStats] = useState({ hits: 0, totalLeads: 0, pendingLeads: 0, qualifiedLeads: 0, contactedLeads: 0, closedLeads: 0 });
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [page, setPage] = useState(1);
    const LEADS_PER_PAGE = 10;

    useEffect(() => {
        fetchLeads();
        fetchStats();
    }, [filter]);

    const fetchStats = async () => {
        const { data: appData } = await supabase.from('app_settings').select('value').eq('key', 'website_hits').single();
        const { count: total } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true });
        const { count: pending } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: qualified } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'qualified');
        const { count: contacted } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted');
        const { count: closed } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'closed');

        setStats({
            hits: appData?.value || 0,
            totalLeads: total || 0,
            pendingLeads: pending || 0,
            qualifiedLeads: qualified || 0,
            contactedLeads: contacted || 0,
            closedLeads: closed || 0
        });
    };

    const showFeedback = (message, type = 'info') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
    };

    const fetchLeads = async (isLoadMore = false) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('growth_leads')
                .select('*')
                .eq('status', filter)
                .order('created_at', { ascending: false })
                .range(isLoadMore ? leads.length : 0, (isLoadMore ? leads.length : 0) + LEADS_PER_PAGE - 1);

            if (!error) {
                if (isLoadMore) setLeads(prev => [...prev, ...data]);
                else setLeads(data);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('growth_leads')
                .update({ status: newStatus })
                .eq('id', id);

            if (!error) {
                setLeads(prev => prev.filter(l => l.id !== id));
            }
        } catch (err) {
            console.error('Update status error:', err);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showFeedback('Reply copied to clipboard! 📋', 'success');
        });
    };

    const handleHeraldAction = (lead, platform) => {
        let url = '';
        if (platform === 'twitter') {
            const twitterText = lead.draft_reply_twitter || lead.draft_reply;
            url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
            showFeedback('Opening X...', 'info');
        } else if (platform === 'reddit') {
            const redditId = lead.platform_id.replace('rd_', '');
            url = `https://www.reddit.com/comments/${redditId}`;
            copyToClipboard(lead.draft_reply);
            showFeedback('Opening Reddit Thread... (Reply copied)', 'info');
        }

        window.open(url, '_blank');
        handleUpdateStatus(lead.id, 'contacted');
    };

    return (
        <div style={{ color: 'white', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            {/* Feedback Toast */}
            {feedback.message && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#6366f1',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {feedback.message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>WEBSITE VISITORS 📈</p>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#6366f1' }}>{stats.hits}</h2>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>AI-FOUND LEADS 🤖</p>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#fff' }}>{stats.totalLeads}</h2>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>PENDING REVIEW 🚦</p>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#f59e0b' }}>{stats.pendingLeads}</h2>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>TOTAL REVENUE 💰</p>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#10b981' }}>
                        ${(stats?.closedLeads || 0) * 49}
                    </h2>
                    <p style={{ color: '#059669', fontSize: '0.65rem', margin: '4px 0 0 0' }}>({stats?.closedLeads || 0} Conversions)</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Commander Center 🤖</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['pending', 'qualified', 'contacted', 'closed', 'rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setFilter(s); setPage(1); }}
                            className={filter === s ? 'btn-primary' : ''}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                background: filter === s ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'pending' ? stats.pendingLeads : s === 'qualified' ? stats.qualifiedLeads : s === 'contacted' ? stats.contactedLeads : s === 'closed' ? stats.closedLeads : '0'})
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <p>Scanning the horizon for founders...</p>
            ) : leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
                    <p style={{ color: '#64748b' }}>No {filter} leads found right now.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {leads.map(lead => (
                        <div key={lead.id} style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            border: (lead.interest_score || 0) >= 8 ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: (lead.interest_score || 0) >= 8 ? '0 0 20px rgba(251, 191, 36, 0.1)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative'
                        }}>
                            {(lead.interest_score || 0) >= 8 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '20px',
                                    background: '#fbbf24',
                                    color: '#000',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                }}>
                                    HIGH INTENT 🔥
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 'bold' }}>{(lead?.platform || 'platform').toUpperCase()}</span>
                                        <a
                                            href={`/og-preview/${lead?.id}`}
                                            target="_blank"
                                            style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'underline' }}
                                        >
                                            View Viral Scorecard 📈
                                        </a>
                                    </div>
                                    <h3 style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {lead.username}
                                        <div style={{
                                            background: (lead.interest_score || 0) >= 8 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.65rem',
                                            color: (lead.interest_score || 0) >= 8 ? '#10b981' : '#94a3b8',
                                            border: `1px solid ${(lead.interest_score || 0) >= 8 ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                                            fontWeight: 'bold'
                                        }}>
                                            Score: {(lead.interest_score || 0)}/10 {(lead.interest_score || 0) >= 8 ? '🔥' : ''}
                                        </div>
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Niche: {lead.niche}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {lead.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'rejected')}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Ignore
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(lead.id, 'qualified')}
                                                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Qualify 💎
                                            </button>
                                        </>
                                    )}
                                    {(lead.status === 'qualified' || lead.status === 'pending') && (
                                        <>
                                            <button
                                                onClick={() => handleHeraldAction(lead, 'twitter')}
                                                style={{ background: '#1DA1F2', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                                            >
                                                Post X
                                            </button>
                                            <button
                                                onClick={() => handleHeraldAction(lead, 'reddit')}
                                                style={{ background: '#FF4500', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Reply Reddit
                                            </button>
                                        </>
                                    )}
                                    {lead.status === 'contacted' && (
                                        <button
                                            onClick={() => handleUpdateStatus(lead.id, 'closed')}
                                            style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                        >
                                            Mark as Paid 💰
                                        </button>
                                    )}
                                    {lead.status === 'closed' && (
                                        <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>✅ CLOSED (PAID)</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                                <p style={{ color: '#94a3b8', margin: 0 }}>"{lead.post_content}"</p>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Draft Replies:</h4>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#FF4500' }}>REDDIT (DETAILED)</span>
                                            <button
                                                onClick={() => copyToClipboard(lead.draft_reply)}
                                                style={{ fontSize: '0.6rem', background: 'none', color: '#94a3b8', border: '1px solid #334155', padding: '0.1rem 0.3rem', borderRadius: '0.2rem', cursor: 'pointer' }}
                                            >Copy</button>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', minHeight: '100px' }}>
                                            {lead.draft_reply}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#1DA1F2' }}>X (CONCISE) - {lead.draft_reply_twitter?.length || 0} chars</span>
                                            <button
                                                onClick={() => copyToClipboard(lead.draft_reply_twitter || lead.draft_reply)}
                                                style={{ fontSize: '0.6rem', background: 'none', color: '#94a3b8', border: '1px solid #334155', padding: '0.1rem 0.3rem', borderRadius: '0.2rem', cursor: 'pointer' }}
                                            >Copy</button>
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: (lead.draft_reply_twitter?.length > 280) ? '#ef4444' : '#cbd5e1',
                                            padding: '0.75rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '0.5rem',
                                            minHeight: '100px',
                                            border: (lead.draft_reply_twitter?.length > 280) ? '1px solid rgba(239, 68, 68, 0.3)' : 'none'
                                        }}>
                                            {lead.draft_reply_twitter || lead.draft_reply}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && leads.length > 0 && leads.length < (filter === 'pending' ? stats.pendingLeads : stats.totalLeads - stats.pendingLeads) && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => fetchLeads(true)}
                        className="btn-primary"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    >
                        Load More Leads
                    </button>
                </div>
            )}
            <style>
                {`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                `}
            </style>
        </div>
    );
};

export default LeadsDashboard;
