import React, { useEffect, useRef, useState, useCallback } from 'react';

const AdBanner: React.FC = () => {
    const adRef = useRef<HTMLModElement>(null);
    const [adInitialized, setAdInitialized] = useState(false);
    
    // IMPORTANT: Replace these with your actual AdSense client and slot IDs.
    const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
    const AD_SLOT = 'YYYYYYYYYY';

    const initAndPushAd = useCallback(() => {
        if (adInitialized || !adRef.current) return;

        const adContainer = adRef.current;
        let attempts = 0;
        const maxAttempts = 10; // Poll for up to 1 second

        const tryPush = () => {
            // Ensure the container is still in the DOM and has a valid width
            if (adContainer.clientWidth > 0) {
                try {
                    // AdSense sometimes adds an iframe; check for it to prevent re-pushing.
                    if (adContainer.querySelector('iframe')) {
                        setAdInitialized(true);
                        return;
                    }
                    
                    adContainer.setAttribute('data-ad-client', AD_CLIENT);
                    adContainer.setAttribute('data-ad-slot', AD_SLOT);
                    
                    if (typeof (window as any).adsbygoogle !== 'undefined') {
                        // Push an ad into the slot.
                        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                        setAdInitialized(true); // Mark as initialized to prevent re-pushes.
                    }
                } catch (e) {
                    console.error('AdSense push error:', e);
                }
            } else {
                // If width is still 0, wait and try again.
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryPush, 100);
                } else {
                    console.warn(`Ad container width is still 0 after ${maxAttempts} attempts. Aborting ad push.`);
                }
            }
        };

        tryPush();

    }, [adInitialized, AD_CLIENT, AD_SLOT]);

    useEffect(() => {
        const adContainer = adRef.current;
        if (!adContainer || adInitialized) {
            return;
        }

        // Stage 1: Use IntersectionObserver to detect when the ad container becomes visible.
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    // Stage 2: Once visible, start polling for a valid width before pushing the ad.
                    initAndPushAd();
                    observer.disconnect(); // We only need to trigger this once.
                }
            },
            {
                threshold: 0.01, // Trigger when 1% of the element is visible
            }
        );

        observer.observe(adContainer);

        return () => {
            observer.disconnect();
        };
    }, [adInitialized, initAndPushAd]);

    const adStyle: React.CSSProperties = {
        display: 'block',
        width: '100%',
        minHeight: '50px', // Prevents layout shift while loading
        backgroundColor: '#f0f0f0',
        borderRadius: '0.5rem'
    };

    return (
        <div className="p-2 text-center">
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={adStyle}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
}

export default AdBanner;