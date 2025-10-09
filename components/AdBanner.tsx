import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdBanner: React.FC = () => {
    const { t } = useTranslation();
    
    // TODO: Replace these with your actual AdSense client and slot IDs
    const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
    const AD_SLOT = 'YYYYYYYYYY';

    useEffect(() => {
        const pushAd = () => {
            try {
                // Ensure adsbygoogle is available on the window before pushing
                if (typeof (window as any).adsbygoogle !== 'undefined') {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                }
            } catch (e) {
                console.error('AdSense push error:', e);
            }
        };

        // Delaying the push slightly to ensure the container has a calculated width.
        // This is a common and effective fix for this error in single-page apps.
        const timeoutId = setTimeout(pushAd, 100);

        return () => clearTimeout(timeoutId);
    }, []);

    // A fallback for when ads don't load or are blocked.
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