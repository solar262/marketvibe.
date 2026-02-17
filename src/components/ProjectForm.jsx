import React, { useState } from 'react';

const ProjectForm = ({ onSubmit, loading, initialName = '' }) => {
    const [formData, setFormData] = useState({
        name: initialName,
        description: '',
        audience: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={handleSubmit} className="project-form">
            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Tell us about your idea</h2>
            <div className="input-group" style={{ flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
                <div style={{ textAlign: 'left' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Project Name</label>
                    <input
                        name="name"
                        type="text"
                        placeholder="e.g. MarketVibe"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="full-width"
                    />
                </div>
                <div style={{ textAlign: 'left' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>What problem are you solving?</label>
                    <textarea
                        name="description"
                        placeholder="e.g. Founders spend too much time building products nobody wants."
                        required
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                </div>
                <div style={{ textAlign: 'left' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Who is your target audience?</label>
                    <input
                        name="audience"
                        type="text"
                        placeholder="e.g. Solo SaaS Founders"
                        required
                        value={formData.audience}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Generating Analysis...' : 'Generate Validation Report'}
                </button>
            </div>
        </form>
    );
};

export default React.memo(ProjectForm);
