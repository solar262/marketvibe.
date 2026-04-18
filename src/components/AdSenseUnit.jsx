import React, { useEffect } from 'react';

const AdSenseUnit = ({ slot, style, format }) => {
  useEffect(() => {
    try {
      // Check if adsbygoogle is available as an object or array
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('AdSense: Initialization suppressed by script blocker or missing library.', e);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
         style={{ display: 'block', ...style }}
         data-ad-client="ca-pub-1690496065763879"
         data-ad-slot={slot || "3331191790"}
         data-ad-format={format || "auto"}
         data-full-width-responsive="true"></ins>
  );
};

export default AdSenseUnit;
