import React, { useState } from 'react';

const Contact = () => {
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Message sent successfully! We will get back to you within 24 hours.');
  };

  return (
    <div style={{ padding: '4rem 0', maxWidth: '600px', margin: '0 auto', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
        Contact Us
      </h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Have a question about a niche? Need technical support? We're here to help.
      </p>

      <div style={{ marginBottom: '3rem', padding: '1.5rem', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Direct Email</div>
        <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>founder@marketvibe1.com</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Business Email</label>
          <input 
            type="email" 
            placeholder="you@company.com" 
            required
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>How can we help?</label>
          <select style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
            <option>General Inquiry</option>
            <option>Partnership Proposal</option>
            <option>Bug Report</option>
            <option>Data Request</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Message</label>
          <textarea 
            rows="5"
            placeholder="Tell us about your project..."
            required
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
          />
        </div>
        <button 
          type="submit"
          style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            border: 'none', 
            padding: '1rem', 
            borderRadius: '8px', 
            fontWeight: '800', 
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#1e3a8a'}
          onMouseOut={(e) => e.target.style.background = '#2563eb'}
        >
          Send Message
        </button>
        {status && <div style={{ color: '#059669', fontWeight: '700', marginTop: '1rem', textAlign: 'center' }}>{status}</div>}
      </form>
    </div>
  );
};

export default Contact;
