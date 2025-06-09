"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/fpixel';

const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "YOUR_FACEBOOK_PIXEL_ID";

export default function FacebookPixelScript() {
  const pathname = usePathname();

  useEffect(() => {
    if (FACEBOOK_PIXEL_ID && FACEBOOK_PIXEL_ID !== "YOUR_FACEBOOK_PIXEL_ID") {
      trackPageView();
    }
  }, [pathname]);

  if (!FACEBOOK_PIXEL_ID || FACEBOOK_PIXEL_ID === "YOUR_FACEBOOK_PIXEL_ID") {
    console.warn("Facebook Pixel ID is not configured. Please set NEXT_PUBLIC_FACEBOOK_PIXEL_ID environment variable.");
    return null;
  }

  return (
    <>
      <Script id="fb-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FACEBOOK_PIXEL_ID}');
        `}
      </Script>
    </>
  );
}
