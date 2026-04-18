import React from 'react';
import AdSenseUnit from './AdSenseUnit';

/**
 * 🏛️ Sidebar Ad Component
 * Optimized for 'skyscraper' or 'large rectangle' formats.
 * Designed to be sticky on desktop.
 */
const SidebarAd = ({ slot = "sidebar_ad_skyscraper" }) => {
  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      position: 'sticky',
      top: '100px',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '0.65rem', 
        fontWeight: 'bold', 
        color: '#64748b', 
        textTransform: 'uppercase', 
        marginBottom: '1rem', 
        letterSpacing: '0.05em' 
      }}>
        Market Insights
      </div>
      
      <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <AdSenseUnit 
           slot={slot} 
           style={{ display: 'block' }} 
           format="vertical"
         />
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#475569', fontStyle: 'italic' }}>
        Curated for Innovators
      </div>
    </div>
  );
};

export default SidebarAd;
