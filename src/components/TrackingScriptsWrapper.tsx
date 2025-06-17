
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import FacebookPixelScript from '@/components/FacebookPixelScript';

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

  if (!isQuizPage) {
    return null; 
  }

  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId.trim() !== "" && googleAnalyticsId !== PLACEHOLDER_GA_ID;

  return (
    <>
      {isGaConfigured && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId.trim()}`}
            onLoad={() => {
              // gtag.js loaded
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
              `,
            }}
          />
        </>
      )}
      <FacebookPixelScript
        facebookPixelId={facebookPixelId}
        facebookPixelIdSecondary={facebookPixelIdSecondary}
        googleAnalyticsId={googleAnalyticsId} 
      />
    </>
  );
}
