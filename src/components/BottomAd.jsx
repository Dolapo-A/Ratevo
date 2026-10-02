import { useEffect } from 'react';

const BottomAd = ({ 
  client = "ca-pub-2268924820751234", 
  slot = "6876141711", 
  format = "auto",
  responsive = true 
}) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive.toString()}
    />
  );
};

export default BottomAd;