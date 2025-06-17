
'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { getActivePixelIds } from '@/lib/fpixel'; // trackFbPageView não é mais chamada daqui diretamente para FB.
import { trackGaPageView, trackGaEvent } from '@/lib/gtag'; // trackGaEvent não é usada aqui diretamente.

interface TrackingScriptsWrapperProps {
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
}

const PLACEHOLDER_GA_ID = "YOUR_GA_ID";

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

    // Subsequent PageViews for Facebook
    if (isAnyFbPixelConfigured && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView'); // Global PageView for all initialized FB pixels on SPA navigation
    }

    // Subsequent PageViews for Google Analytics
    if (isGaConfigured && typeof window.gtag === 'function' && googleAnalyticsId) {
      trackGaPageView(new URL(pathname, window.location.origin), googleAnalyticsId);
    }
  }, [pathname, isQuizPage, isAnyFbPixelConfigured, isGaConfigured, googleAnalyticsId]);


  if (!isQuizPage) {
    return null; 
  }

  // Construct FB Pixel initialization script
  let fbPixelBaseCode = "";
  if (isAnyFbPixelConfigured) {
    const initCalls = activeFbPixelIds.map(id => `fbq('init', '${id}');`).join('\n      ');
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
            id="gtag-js-loader" // Changed ID to be more specific
          />
          <Script
            id="gtag-init-config" // Changed ID
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
          id="fb-pixel-base-code" // Changed ID
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: fbPixelBaseCode }}
        />
      )}
    </>
  );
}
    