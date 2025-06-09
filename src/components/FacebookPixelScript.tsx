
"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/fpixel';
import { 
  FACEBOOK_PIXEL_ID, 
  FACEBOOK_PIXEL_ID_SECONDARY,
  isPrimaryPixelConfigured,
  isSecondaryPixelConfigured,
  areAnyPixelsConfigured
} from '@/config/pixelConfig';

export default function FacebookPixelScript() {
  const pathname = usePathname();

  useEffect(() => {
    // If at least one pixel is configured and has been initialized by the script below,
    // then track the PageView. trackPageView() calls fbq('track', 'PageView'),
    // which sends the event to all initialized pixels.
    if (areAnyPixelsConfigured()) {
      trackPageView();
    }
  }, [pathname]); // Dependencies for the effect

  // If neither pixel is configured, don't render the script tag.
  if (!areAnyPixelsConfigured()) {
    return null;
  }

  // Construct the Facebook Pixel script content.
  // This includes the base loader and conditional initialization for each pixel.
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
  `;
  // The PageView event itself is sent via the trackPageView() call in the useEffect hook,
  // which is standard for SPA/Next.js applications to correctly track initial loads and client-side navigations.

  return (
    <>
      <Script id="fb-pixel-base" strategy="afterInteractive">
        {pixelScriptContent}
      </Script>
    </>
  );
}
