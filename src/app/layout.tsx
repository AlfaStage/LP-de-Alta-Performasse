
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import FacebookPixelScript from '@/components/FacebookPixelScript';
import Script from 'next/script';
import { getWhitelabelConfig, hexToHslString } from '@/lib/whitelabel'; // Import whitelabel config and hexToHslString
import { APP_BASE_URL } from '@/config/appConfig'; // Keep for non-whitelabel env vars

export const metadata: Metadata = {
  title: 'Ice Lazer Lead Filter', // This could also become dynamic later
  description: 'Quiz interativo para qualificação de leads para Ice Lazer.', // Also dynamic
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const whitelabelConfig = await getWhitelabelConfig();

  const primaryColorHslString = whitelabelConfig.primaryColorHex ? hexToHslString(whitelabelConfig.primaryColorHex) : null;
  const secondaryColorHslString = whitelabelConfig.secondaryColorHex ? hexToHslString(whitelabelConfig.secondaryColorHex) : null;

  // Prepare dynamic styles for theme colors
  const dynamicStyles = `
    :root {
      ${primaryColorHslString ? `--primary: ${primaryColorHslString};` : ''}
      ${secondaryColorHslString ? `--secondary: ${secondaryColorHslString};` : ''}
      /* If other colors like accent, background, foreground were configurable: */
      /* ${whitelabelConfig.accentColorHex ? `--accent: ${hexToHslString(whitelabelConfig.accentColorHex)};` : ''} */
      /* ${whitelabelConfig.backgroundColorHex ? `--background: ${hexToHslString(whitelabelConfig.backgroundColorHex)};` : ''} */
      /* ${whitelabelConfig.foregroundColorHex ? `--foreground: ${hexToHslString(whitelabelConfig.foregroundColorHex)};` : ''} */
    }
  `;

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="facebook-domain-verification" content="7dowgwz24hni45q2fjdp19cp0ztgzn" />
        
        {/* Inject dynamic theme colors */}
        <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />

        {whitelabelConfig.googleAnalyticsId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${whitelabelConfig.googleAnalyticsId}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${whitelabelConfig.googleAnalyticsId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <FacebookPixelScript 
          facebookPixelId={whitelabelConfig.facebookPixelId}
          facebookPixelIdSecondary={whitelabelConfig.facebookPixelIdSecondary}
          googleAnalyticsId={whitelabelConfig.googleAnalyticsId} // Pass GA ID for consistency if FacebookPixelScript handles GA pageview logic
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
