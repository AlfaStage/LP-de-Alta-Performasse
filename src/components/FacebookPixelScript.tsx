
"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackPageView as fbTrackPageView } from '@/lib/fpixel';
import { pageview as gaTrackPageView } from '@/lib/gtag';

interface FacebookPixelScriptProps {
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
}

export default function FacebookPixelScript({ 
  facebookPixelId, 
  facebookPixelIdSecondary,
  googleAnalyticsId 
}: FacebookPixelScriptProps) {
  const pathname = usePathname();

  const isPrimaryPixelConfigured = !!facebookPixelId && facebookPixelId !== "YOUR_PRIMARY_FACEBOOK_PIXEL_ID";
  const isSecondaryPixelConfigured = !!facebookPixelIdSecondary && facebookPixelIdSecondary !== "YOUR_SECONDARY_FACEBOOK_PIXEL_ID";
  const areAnyFbPixelsConfigured = isPrimaryPixelConfigured || isSecondaryPixelConfigured;
  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId !== "YOUR_GA_ID";


  useEffect(() => {
    if (areAnyFbPixelsConfigured) {
      console.log("FB Pixel: PageView event triggered by route change.", pathname);
      fbTrackPageView();
    }

    if (isGaConfigured && typeof window.gtag === 'function') {
      console.log("GA: pageview event triggered by route change.", pathname);
      gaTrackPageView(new URL(pathname, window.location.origin));
    }
  }, [pathname, areAnyFbPixelsConfigured, isGaConfigured]);

  if (!areAnyFbPixelsConfigured && !isGaConfigured) {
    console.warn("Neither Facebook Pixel nor Google Analytics is configured via Whitelabel settings. No tracking scripts rendered.");
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
    ${isPrimaryPixelConfigured ? `fbq('init', '${facebookPixelId}');` : ''}
    ${isSecondaryPixelConfigured ? `fbq('init', '${facebookPixelIdSecondary}');` : ''}
    ${areAnyFbPixelsConfigured ? `fbq('track', 'PageView'); console.log("FB Pixel: Initial PageView event sent via script.");` : `console.warn("FB Pixel: No pixels configured, initial PageView not sent.");`}
  `;

  return (
    <>
      {areAnyFbPixelsConfigured && (
        <Script id="fb-pixel-base" strategy="afterInteractive">
          {pixelScriptContent}
        </Script>
      )}
      {!areAnyFbPixelsConfigured && isGaConfigured && console.warn("Facebook Pixel not configured (Whitelabel), but Google Analytics is.")}
    </>
  );
}
