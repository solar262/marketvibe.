import React from 'react';

/**
 * 🛡️ MarketVibe Safety Shield (ErrorBoundary)
 * Catches component-level crashes and provides a recovery UI
 * to prevent the "Blank Screen" White Screen of Death.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("🏥 MarketVibe Critical Component Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a1a',
                    color: '#fff',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        background: 'rgba(255, 68, 68, 0.05)',
                        border: '1px solid rgba(255, 68, 68, 0.2)',
                        padding: '3rem',
                        borderRadius: '24px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛰️</div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
                            Connection Recalibrating...
                        </h1>
                        <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            A component in the Intelligence Center encountered an unexpected parameter. 
                            The self-healing protocol has been initiated.
                        </p>
                        
                        <div style={{ 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '1rem', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem', 
                            color: '#ef4444',
                            fontFamily: 'monospace',
                            textAlign: 'left',
                            marginBottom: '2rem',
                            overflow: 'auto',
                            maxHeight: '100px'
                        }}>
                            CODE: {this.state.error?.message || "SWARM_COLLISION"}
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#6366f1',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 32px',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                        >
                            Reload Swarm Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
