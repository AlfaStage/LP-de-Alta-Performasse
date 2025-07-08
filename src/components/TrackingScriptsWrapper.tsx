
'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { trackGaPageView, trackGaEvent } from '@/lib/gtag'; 

interface TrackingScriptsWrapperProps {
  finalFacebookPixelIds: string[];
  googleAnalyticsId?: string;
}

const PLACEHOLDER_GA_ID = "YOUR_GA_ID";

export default function TrackingScriptsWrapper({
  finalFacebookPixelIds,
  googleAnalyticsId,
}: TrackingScriptsWrapperProps) {
  const pathname = usePathname();

  const isAnyFbPixelConfigured = finalFacebookPixelIds.length > 0;
  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId.trim() !== "" && googleAnalyticsId !== PLACEHOLDER_GA_ID;

  // Effect for handling SPA navigations after initial load
  useEffect(() => {
    // This effect is more relevant if the wrapper lives in a layout that persists across navigations.
    // If it's rendered per-page, the initial script execution handles the first PageView.
    // However, keeping it handles potential complex SPA routing where the component might not re-mount.
    
    // Subsequent PageViews for Facebook
    if (isAnyFbPixelConfigured && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }

    // Subsequent PageViews for Google Analytics
    if (isGaConfigured && typeof window.gtag === 'function' && googleAnalyticsId) {
      trackGaPageView(new URL(pathname, window.location.origin), googleAnalyticsId);
    }
  }, [pathname, isAnyFbPixelConfigured, isGaConfigured, googleAnalyticsId]);

  // Construct FB Pixel initialization script
  let fbPixelBaseCode = "";
  if (isAnyFbPixelConfigured) {
    const initCalls = finalFacebookPixelIds.map(id => `fbq('init', '${id}');`).join('\n      ');
    fbPixelBaseCode = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      ${initCalls}
      fbq('track', 'PageView'); // Initial PageView for ALL initialized pixels
    `;
  }
  
  return (
    <>
      {/* Google Analytics Initialization & Initial PageView */}
      {isGaConfigured && googleAnalyticsId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId.trim()}`}
            id="gtag-js-loader"
          />
          <Script
            id="gtag-init-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId.trim()}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* Facebook Pixel Base Code, Initialization & Initial PageView */}
      {isAnyFbPixelConfigured && fbPixelBaseCode && (
        <Script 
          id="fb-pixel-base-code"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: fbPixelBaseCode }}
        />
      )}
    </>
  );
}
