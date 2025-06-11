
"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackPageView as fbTrackPageView } from '@/lib/fpixel'; // Renomeado para evitar conflito
import { pageview as gaTrackPageView } from '@/lib/gtag'; // Import GA pageview tracker
import { 
  FACEBOOK_PIXEL_ID, 
  FACEBOOK_PIXEL_ID_SECONDARY,
  isPrimaryPixelConfigured,
  isSecondaryPixelConfigured,
  areAnyPixelsConfigured
} from '@/config/pixelConfig';
import { GA_TRACKING_ID } from '@/lib/gtag';


export default function FacebookPixelScript() {
  const pathname = usePathname();

  useEffect(() => {
    // Track PageView for Facebook Pixel on route change
    if (areAnyPixelsConfigured()) {
      console.log("FB Pixel: PageView event triggered by route change.", pathname);
      fbTrackPageView();
    }

    // Track PageView for Google Analytics on route change
    if (GA_TRACKING_ID && typeof window.gtag === 'function') {
      console.log("GA: pageview event triggered by route change.", pathname);
      gaTrackPageView(new URL(pathname, window.location.origin));
    }

  }, [pathname]);

  if (!areAnyPixelsConfigured() && !GA_TRACKING_ID) {
    console.warn("Neither Facebook Pixel nor Google Analytics is configured. No tracking scripts rendered.");
    return null;
  }
  
  const pixelScriptContent = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    ${isPrimaryPixelConfigured ? `fbq('init', '${FACEBOOK_PIXEL_ID}');` : ''}
    ${isSecondaryPixelConfigured ? `fbq('init', '${FACEBOOK_PIXEL_ID_SECONDARY}');` : ''}
    ${areAnyPixelsConfigured() ? `fbq('track', 'PageView'); console.log("FB Pixel: Initial PageView event sent via script.");` : `console.warn("FB Pixel: No pixels configured, initial PageView not sent.");`}
  `;

  return (
    <>
      {areAnyPixelsConfigured() && (
        <Script id="fb-pixel-base" strategy="afterInteractive">
          {pixelScriptContent}
        </Script>
      )}
      {!areAnyPixelsConfigured() && GA_TRACKING_ID && console.warn("Facebook Pixel not configured, but Google Analytics is.")}
    </>
  );
}
