import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdBanner: React.FC = () => {
    const { t } = useTranslation();
    
    // TODO: Replace these with your actual AdSense client and slot IDs
    const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
    const AD_SLOT = 'YYYYYYYYYY';

    useEffect(() => {
        try {
            // This is the standard way to push an ad request.
            // The script is already loaded in index.html for simplicity, 
            // but this ensures it runs for this component.
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    // A fallback for when ads don't load or are blocked.
    // In a real scenario, you might hide the container or show a subtle message.
    const adStyle: React.CSSProperties = {
        display: 'block',
        width: '100%',
        minHeight: '60px', // Prevents layout shift
        backgroundColor: '#f0f0f0',
        textAlign: 'center',
        lineHeight: '60px',
        fontSize: '12px',
        color: '#888'
    };

    return (
        <div className="bg-gray-100 rounded-lg p-1 text-center">
            <ins
                className="adsbygoogle"
                style={adStyle}
                data-ad-client={AD_CLIENT}
                data-ad-slot={AD_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
}

export default AdBanner;
