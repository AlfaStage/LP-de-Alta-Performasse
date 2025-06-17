
'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { getActivePixelIds, trackFbPageView } from '@/lib/fpixel';
import { trackGaPageView } from '@/lib/gtag';

interface TrackingScriptsWrapperProps {
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
}

const PLACEHOLDER_GA_ID = "YOUR_GA_ID"; // Define if not already present in gtag.ts

export default function TrackingScriptsWrapper({
  facebookPixelId,
  facebookPixelIdSecondary,
  googleAnalyticsId,
}: TrackingScriptsWrapperProps) {
  const pathname = usePathname();
  const isQuizPage = !pathname.startsWith('/config');

  const activeFbPixelIds = useMemo(
    () => getActivePixelIds(facebookPixelId, facebookPixelIdSecondary),
    [facebookPixelId, facebookPixelIdSecondary]
  );
  
  const isAnyFbPixelConfigured = activeFbPixelIds.length > 0;
  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId.trim() !== "" && googleAnalyticsId !== PLACEHOLDER_GA_ID;

  // Effect for handling SPA navigations after initial load
  useEffect(() => {
    if (!isQuizPage) return;

    // Subsequent PageViews
    if (isAnyFbPixelConfigured && typeof window.fbq === 'function') {
      trackFbPageView(); // Global PageView for all initialized FB pixels
    }

    if (isGaConfigured && typeof window.gtag === 'function' && googleAnalyticsId) {
      trackGaPageView(new URL(pathname, window.location.origin), googleAnalyticsId);
    }
  }, [pathname, isQuizPage, isAnyFbPixelConfigured, isGaConfigured, googleAnalyticsId]);


  if (!isQuizPage) {
    return null; 
  }

  // Construct FB Pixel initialization script
  let fbPixelInitScript = "";
  if (isAnyFbPixelConfigured) {
    const initCalls = activeFbPixelIds.map(id => `fbq('init', '${id}');`).join('\n      ');
    fbPixelInitScript = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      ${initCalls}
      fbq('track', 'PageView'); // Initial PageView for all initialized pixels
    `;
  }
  
  return (
    <>
      {/* Google Analytics Initialization */}
      {isGaConfigured && googleAnalyticsId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId.trim()}`}
            id="gtag-js"
          />
          <Script
            id="gtag-init"
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

      {/* Facebook Pixel Initialization */}
      {isAnyFbPixelConfigured && (
        <Script 
          id="fb-pixel-init" 
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: fbPixelInitScript }}
        />
      )}
    </>
  );
}

    