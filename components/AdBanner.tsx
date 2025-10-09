import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const AdBanner: React.FC = () => {
    const { t } = useTranslation();
    const adRef = useRef<HTMLModElement>(null);
    
    // TODO: Replace these with your actual AdSense client and slot IDs
    const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
    const AD_SLOT = 'YYYYYYYYYY';

    useEffect(() => {
        const pushAd = () => {
            try {
                if (typeof (window as any).adsbygoogle !== 'undefined') {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                }
            } catch (e) {
                console.error('AdSense push error:', e);
            }
        };

        // This is a more robust check that waits for the ad container to be physically rendered
        // with a width before trying to push the ad.
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target.clientWidth > 0) {
                    pushAd();
                    // Once the ad is pushed, we don't need to observe anymore.
                    observer.disconnect();
                }
            }
        });

        if (adRef.current) {
            observer.observe(adRef.current);
        }

        return () => {
            observer.disconnect();
        };
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
                ref={adRef}
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
