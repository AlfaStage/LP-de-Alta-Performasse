
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import FacebookPixelScript from '@/components/FacebookPixelScript';
import Script from 'next/script';
import { getWhitelabelConfig, hexToHslString } from '@/lib/whitelabel'; 
// APP_BASE_URL can still be used for other purposes if needed, but whitelabel config drives UI/tracking.

// Function to generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  const whitelabelConfig = await getWhitelabelConfig();
  return {
    title: whitelabelConfig.projectName || 'Ice Lazer Lead Filter',
    description: `Quiz interativo para qualificação de leads para ${whitelabelConfig.projectName || 'Ice Lazer'}.`,
  };
}

export const viewport: Viewport = {
  themeColor: [ // You might want to make this dynamic based on whitelabelConfig.primaryColorHex too
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  // other viewport settings
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const whitelabelConfig = await getWhitelabelConfig();

  const primaryColorHslString = whitelabelConfig.primaryColorHex ? hexToHslString(whitelabelConfig.primaryColorHex) : null;
  const secondaryColorHslString = whitelabelConfig.secondaryColorHex ? hexToHslString(whitelabelConfig.secondaryColorHex) : null;
  const pageBackgroundColorHslString = whitelabelConfig.pageBackgroundColorHex ? hexToHslString(whitelabelConfig.pageBackgroundColorHex) : null;
  const quizBackgroundColorHslString = whitelabelConfig.quizBackgroundColorHex ? hexToHslString(whitelabelConfig.quizBackgroundColorHex) : null;

  // Prepare dynamic styles for theme colors
  // These will override the defaults in globals.css
  const dynamicStyles = `
    :root {
      ${pageBackgroundColorHslString ? `--background: ${pageBackgroundColorHslString};` : ''}
      ${quizBackgroundColorHslString ? `--card: ${quizBackgroundColorHslString};` : ''}
      ${primaryColorHslString ? `--primary: ${primaryColorHslString};` : ''}
      ${secondaryColorHslString ? `--secondary: ${secondaryColorHslString};` : ''}
      /* Foreground, card-foreground, etc., are defined in globals.css and will use these new backgrounds. */
      /* Ensure they provide enough contrast with the user-chosen background/card colors. */
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
          googleAnalyticsId={whitelabelConfig.googleAnalyticsId} 
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
