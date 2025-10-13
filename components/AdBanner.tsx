import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const AdBanner: React.FC = () => {
    const { t } = useTranslation();
    const adRef = useRef<HTMLModElement>(null);
    const [adInitialized, setAdInitialized] = useState(false);
    
    // IMPORTANT: Replace these with your actual AdSense client and slot IDs.
    const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
    const AD_SLOT = 'YYYYYYYYYY';

    useEffect(() => {
        // Don't do anything if the ad has already been pushed or the ref isn't ready.
        if (adInitialized || !adRef.current) {
            return;
        }

        const adContainer = adRef.current;

        const initAndPushAd = () => {
            if (adInitialized) return; // Double-check to prevent race conditions
            try {
                // Set attributes and then push the ad
                adContainer.setAttribute('data-ad-client', AD_CLIENT);
                adContainer.setAttribute('data-ad-slot', AD_SLOT);
                
                if (typeof (window as any).adsbygoogle !== 'undefined') {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                    setAdInitialized(true); // Mark as initialized to prevent re-pushes
                }
            } catch (e) {
                console.error('AdSense push error:', e);
            }
        };

        // If the container is already visible with a width, push the ad immediately.
        if (adContainer.clientWidth > 0) {
            initAndPushAd();
            return;
        }

        // If not, wait for it to become visible using ResizeObserver.
        // This is crucial for elements in collapsible sidebars.
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry.target.clientWidth > 0) {
                initAndPushAd();
                observer.disconnect(); // We only need to do this once.
            }
        });

        observer.observe(adContainer);

        return () => {
            observer.disconnect();
        };
    }, [adInitialized]);

    const adStyle: React.CSSProperties = {
        display: 'block',
        width: '100%',
        minHeight: '50px', // Prevents layout shift
        backgroundColor: '#f0f0f0',
        borderRadius: '0.5rem'
    };

    return (
        <div className="p-2 text-center">
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={adStyle}
                // data-ad-client and data-ad-slot are set dynamically by the useEffect
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
}

export default AdBanner;
