import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adminKey, setAdminKey] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isRebooting, setIsRebooting] = useState(false);
    const navigate = useNavigate();

    const handleLogin = () => {
        if (adminKey === 'alpha-revenue-2026') {
            setIsAuthorized(true);
            localStorage.setItem('marketvibe_admin', 'true');
        }
    };

    const handleReboot = () => {
        setIsRebooting(true);
        setTimeout(() => {
            setIsRebooting(false);
            const newLog = { id: Date.now(), time: new Date().toISOString(), message: "Swarm Reboot Complete: 100/100 nodes active", status: "success" };
            setLogs(prev => [newLog, ...prev]);
        }, 3000);
    };

    useEffect(() => {
        if (localStorage.getItem('marketvibe_admin') === 'true') {
            setIsAuthorized(true);
        }
    }, []);

    useEffect(() => {
        if (!isAuthorized) return;
        const timer = setTimeout(() => {
            const mockLogs = [
                { id: 1, time: new Date().toISOString(), message: "Twitter Swarm: Node [3] targeted 'how to validate startup'", status: "success" },
                { id: 2, time: new Date().toISOString(), message: "Reddit Swarm: Node [1] posted in r/saas", status: "success" },
                { id: 3, time: new Date().toISOString(), message: "Self-Healing: Twitter Node [14] rebooted successfully", status: "info" },
                { id: 4, time: new Date().toISOString(), message: "AdSense: Global CPM optimization active", status: "revenue" }
            ];
            setLogs(mockLogs);
            setIsLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, [isAuthorized]);

    if (!isAuthorized) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '1px solid #334155' }}>
                    <h1 style={{ color: '#fff', marginBottom: '1.5rem' }}>COMMAND CENTER</h1>
                    <input 
                        type="password" 
                        placeholder="Master Key" 
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', width: '100%', marginBottom: '1.5rem' }}
                    />
                    <button onClick={handleLogin} className="btn-primary" style={{ width: '100%' }}>Access Terminal</button>
                    <div style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.8rem' }}>Alpha Revenue Protocol v2.5 (Swarm Mode)</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Intelligence Command Center</h1>
                        <p style={{ color: '#94a3b8' }}>Swarm Mode Active: 100/100 Slots Synchronized</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ background: '#1e293b', padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Session Traffic</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>+1.2k / hr</div>
                        </div>
                        <button className="btn-secondary" onClick={() => navigate('/')}>Exit Console</button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                    <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0 }}>Live Activity Feed</h3>
                            <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>● All Systems Calibrated</span>
                        </div>
                        <div style={{ padding: '1rem', height: '500px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            {logs.map((log) => (
                                <LogEntry key={log.id} log={log} />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '24px', border: '1px solid #334155' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Swarm Command</h4>
                            <button 
                                disabled={isRebooting}
                                onClick={handleReboot}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: isRebooting ? '#475569' : '#dc2626', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1rem' }}
                            >
                                {isRebooting ? 'Resetting Nodes...' : 'Reboot Drone Swarm'}
                            </button>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>Agentic Self-Correction Sweep</div>
                        </div>

                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '24px', border: '1px solid #334155' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Niche Heatmap</h4>
                            <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <Bar val="80%" label="US" />
                                <Bar val="45%" label="UK" />
                                <Bar val="60%" label="CA" />
                                <Bar val="30%" label="AU" />
                            </div>
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, #1e40af, #312e81)', padding: '1.5rem', borderRadius: '24px', color: '#fff' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Milestone Progress</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$842.00 <span style={{ fontSize: '0.9rem', color: '#bfdbfe' }}>/ mo</span></div>
                            <div style={{ marginTop: '1rem', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                <div style={{ width: '42%', height: '100%', background: '#fff', borderRadius: '4px' }}></div>
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', textAlign: 'right' }}>42% of $2,000 Milestone</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LogEntry = React.memo(({ log }) => (
    <div style={{ marginBottom: '0.75rem', padding: '0.5rem', borderLeft: `3px solid ${log.status === 'success' ? '#22c55e' : log.status === 'revenue' ? '#f59e0b' : '#3b82f6'}`, background: 'rgba(255,255,255,0.02)' }}>
        <span style={{ color: '#64748b' }}>[{new Date(log.time).toLocaleTimeString()}]</span> {log.message}
    </div>
));

const Bar = ({ val, label }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '100%', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px', height: '100px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: val, background: '#3b82f6', transition: 'height 1s ease' }}></div>
        </div>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{label}</span>
    </div>
);

const HealthRow = ({ label, status, count }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <div style={{ fontSize: '0.9rem' }}>{label}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Nodes: {count}</div>
        </div>
        <div style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.7rem', textTransform: 'uppercase' }}>{status}</div>
    </div>
);

export default AdminDashboard;
