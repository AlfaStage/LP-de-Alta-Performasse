
"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { trackPageView as fbTrackPageViewInternal, getActivePixelIds } from '@/lib/fpixel'; // Renamed to avoid conflict
import { pageview as gaTrackPageView } from '@/lib/gtag';

interface FacebookPixelScriptProps {
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
}

const PLACEHOLDER_GA_ID = "YOUR_GA_ID";

export default function FacebookPixelScript({ 
  facebookPixelId, 
  facebookPixelIdSecondary,
  googleAnalyticsId 
}: FacebookPixelScriptProps) {
  const pathname = usePathname();

  const configuredFbPixelIds = useMemo(
    () => getActivePixelIds(facebookPixelId, facebookPixelIdSecondary),
    [facebookPixelId, facebookPixelIdSecondary]
  );
  
  const areAnyFbPixelsConfigured = configuredFbPixelIds.length > 0;
  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId.trim() !== "" && googleAnalyticsId !== PLACEHOLDER_GA_ID;

  useEffect(() => {
    // For SPA navigations (route changes after initial load)
    if (areAnyFbPixelsConfigured && typeof window.fbq === 'function') {
      fbTrackPageViewInternal(); // Call the simplified PageView tracker from lib/fpixel.ts
    }

    if (isGaConfigured && typeof window.gtag === 'function') {
      // GA pageview for SPA navigations
      gaTrackPageView(new URL(pathname, window.location.origin), googleAnalyticsId);
    }
  }, [pathname, areAnyFbPixelsConfigured, isGaConfigured, googleAnalyticsId]); // configuredFbPixelIds removed as fbTrackPageViewInternal is now global

  if (!areAnyFbPixelsConfigured) {
    return null;
  }
  
  let fbPixelInits = "";
  configuredFbPixelIds.forEach(id => {
    fbPixelInits += `fbq('init', '${id}');\n`;
  });

  // The initial PageView for ALL configured pixels is sent here after init.
  const pixelScriptContent = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    ${fbPixelInits}
    fbq('track', 'PageView'); 
  `;

  return (
    <>
      <Script id="fb-pixel-base" strategy="afterInteractive">
        {pixelScriptContent}
      </Script>
    </>
  );
}
