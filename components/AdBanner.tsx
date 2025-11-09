import React, { useEffect, useRef, useState, useCallback } from 'react';

const AdBanner: React.FC = () => {
    const adRef = useRef<HTMLModElement>(null);
    const [adInitialized, setAdInitialized] = useState(false);

    // Read AdSense configuration from environment variables
    const AD_CLIENT = (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID;
    const AD_SLOT = (import.meta as any).env?.VITE_ADSENSE_SLOT_ID;

    // If AdSense is not configured, render nothing in production.
    if (!AD_CLIENT || !AD_SLOT) {
        if ((import.meta as any).env?.DEV) { // Show a placeholder in development
            return (
                <div className="px-4 pb-2 text-center">
                    <div className="w-full max-w-[728px] min-h-[50px] bg-gray-700/50 text-gray-500 text-xs sm:text-sm flex items-center justify-center rounded-md">
                        Ad Banner Placeholder (VITE_ADSENSE_CLIENT_ID not set)
                    </div>
                </div>
            );
        }
        return null; // Render nothing in production
    }
    
    // This function injects the script and pushes the ad
    const initAndPushAd = useCallback(() => {
        if (adInitialized || !adRef.current) return;

        // Dynamically inject the AdSense script
        if (!document.querySelector(`script[src*="adsbygoogle.js"]`)) {
            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
            script.async = true;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }

        // The original logic to wait for the container to be ready
        let attempts = 0;
        const maxAttempts = 10;
        const tryPush = () => {
            if (adRef.current && adRef.current.clientWidth > 0) {
                try {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                    setAdInitialized(true);
                } catch (e) {
                    console.error('AdSense push error:', e);
                }
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryPush, 100);
                }
            }
        };
        tryPush();
    }, [adInitialized, AD_CLIENT]);

    useEffect(() => {
        const adContainer = adRef.current;
        if (!adContainer || adInitialized) return;

        // Use IntersectionObserver to load the ad only when it's visible
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    initAndPushAd();
                    observer.disconnect();
                }
            },
            { threshold: 0.01 }
        );
        observer.observe(adContainer);
        return () => observer.disconnect();
    }, [adInitialized, initAndPushAd]);

    const adStyle: React.CSSProperties = {
        display: 'block',
        width: '100%',
        minHeight: '50px',
        backgroundColor: 'transparent',
    };

    return (
        <div className="px-4 pb-2 text-center bg-gray-800">
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
};

export default AdBanner;
