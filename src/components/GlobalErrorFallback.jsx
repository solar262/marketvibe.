import React from 'react';

class GlobalErrorFallback extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: '#ef4444', backgroundColor: '#1a1a1a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
                    <h1>🛑 Application Crashed</h1>
                    <p>Something went wrong. Please show this to the developer.</p>
                    <div style={{ background: '#000', padding: '1rem', borderRadius: '8px', overflow: 'auto', marginTop: '1rem' }}>
                        <code style={{ fontSize: '1.2rem', color: '#f87171' }}>
                            {this.state.error && this.state.error.toString()}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '2rem', padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
                    >
                        Refresh App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorFallback;
