
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import FacebookPixelScript from '@/components/FacebookPixelScript';

interface TrackingScriptsWrapperProps {
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
}

const PLACEHOLDER_GA_ID = "YOUR_GA_ID"; // Define placeholder for GA ID comparison

export default function TrackingScriptsWrapper({
  facebookPixelId,
  facebookPixelIdSecondary,
  googleAnalyticsId,
}: TrackingScriptsWrapperProps) {
  const pathname = usePathname();

  // Determine if the current page is a quiz page (not a dashboard page)
  // Only load scripts if not on a /config/* path
  const isQuizPage = !pathname.startsWith('/config');

  if (!isQuizPage) {
    // console.log("[TrackingScriptsWrapper] Not a quiz page, skipping script rendering. Path:", pathname);
    return null; // Don't render anything on dashboard pages
  }

  // console.log("[TrackingScriptsWrapper] Quiz page detected, rendering scripts. Path:", pathname);

  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId.trim() !== "" && googleAnalyticsId !== PLACEHOLDER_GA_ID;

  // Render scripts only on quiz pages
  return (
    <>
      {isGaConfigured && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId.trim()}`}
            onLoad={() => {
              // console.log(`GA: gtag.js loaded for ID: ${googleAnalyticsId.trim()}`);
            }}
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
                console.log("GA: Initial config and pageview sent via TrackingScriptsWrapper (ID: ${googleAnalyticsId.trim()}, Path: " + window.location.pathname + ").");
              `,
            }}
          />
        </>
      )}
      <FacebookPixelScript
        facebookPixelId={facebookPixelId}
        facebookPixelIdSecondary={facebookPixelIdSecondary}
        googleAnalyticsId={googleAnalyticsId} // Pass it along, FacebookPixelScript handles GA pageview on route change if needed
      />
    </>
  );
}
