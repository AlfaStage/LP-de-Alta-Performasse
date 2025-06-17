
"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react'; // Added useMemo
import { trackPageView as fbTrackPageView, getActivePixelIds } from '@/lib/fpixel';
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
    // This component is only rendered on quiz pages due to TrackingScriptsWrapper
    if (areAnyFbPixelsConfigured && typeof window.fbq === 'function') {
      // console.log("FB Pixel: PageView event triggered by route change.", pathname, "Pixels:", configuredFbPixelIds);
      fbTrackPageView(configuredFbPixelIds); // Pass configuredFbPixelIds for subsequent page views
    }

    if (isGaConfigured && typeof window.gtag === 'function') {
      // console.log("GA: pageview event triggered by route change (from FacebookPixelScript).", pathname);
      gaTrackPageView(new URL(pathname, window.location.origin), googleAnalyticsId);
    }
  }, [pathname, areAnyFbPixelsConfigured, isGaConfigured, googleAnalyticsId, configuredFbPixelIds]);

  if (!areAnyFbPixelsConfigured) {
    // console.warn("FB Pixel: No valid Facebook Pixel IDs configured. FB Pixel script not rendered by FacebookPixelScript component.");
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
    console.log("FB Pixel: Initial PageView event sent via script for IDs: ${configuredFbPixelIds.join(', ')}.");
  `;

  return (
    <>
      <Script id="fb-pixel-base" strategy="afterInteractive">
        {pixelScriptContent}
      </Script>
    </>
  );
}
