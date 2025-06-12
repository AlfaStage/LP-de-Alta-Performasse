
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import FacebookPixelScript from '@/components/FacebookPixelScript';
import Script from 'next/script';
import { getWhitelabelConfig, hexToHslString } from '@/lib/whitelabel'; 

export async function generateMetadata(): Promise<Metadata> {
  const whitelabelConfig = await getWhitelabelConfig();
  return {
    title: whitelabelConfig.projectName || 'Ice Lazer Lead Filter',
    description: `Quiz interativo para qualificação de leads para ${whitelabelConfig.projectName || 'Ice Lazer'}.`,
  };
}

export const viewport: Viewport = {
  themeColor: [ 
    { media: '(prefers-color-scheme: light)', color: 'white' }, // Fallback, will be influenced by --background
    { media: '(prefers-color-scheme: dark)', color: 'black' },  // Fallback for dark mode
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const whitelabelConfig = await getWhitelabelConfig();

  const primaryColorForThemeHslString = whitelabelConfig.primaryColorHex ? hexToHslString(whitelabelConfig.primaryColorHex) : null;
  const secondaryColorHslString = whitelabelConfig.secondaryColorHex ? hexToHslString(whitelabelConfig.secondaryColorHex) : null;
  const pageBackgroundColorHslString = whitelabelConfig.pageBackgroundColorHex ? hexToHslString(whitelabelConfig.pageBackgroundColorHex) : null;
  const quizBackgroundColorHslString = whitelabelConfig.quizBackgroundColorHex ? hexToHslString(whitelabelConfig.quizBackgroundColorHex) : null;
  
  // Determine the HSL string for --primary (used for button backgrounds and main interactive elements)
  let buttonPrimaryBgHslString: string | null = null;
  if (whitelabelConfig.buttonPrimaryBgColorHex && whitelabelConfig.buttonPrimaryBgColorHex.trim() !== "") {
    buttonPrimaryBgHslString = hexToHslString(whitelabelConfig.buttonPrimaryBgColorHex);
  }
  // If buttonPrimaryBgColorHex is not set or invalid, fallback to primaryColorForThemeHslString for --primary
  const finalPrimaryForButtonsHsl = buttonPrimaryBgHslString || primaryColorForThemeHslString;

  const dynamicStyles = `
    :root {
      ${pageBackgroundColorHslString ? `--background: ${pageBackgroundColorHslString};` : ''}
      ${quizBackgroundColorHslString ? `--card: ${quizBackgroundColorHslString};` : ''}
      ${finalPrimaryForButtonsHsl ? `--primary: ${finalPrimaryForButtonsHsl};` : ''}
      ${secondaryColorHslString ? `--secondary: ${secondaryColorHslString};` : ''}
      
      /* --ring and --chart-1 will use the theme's primary color, not necessarily the button color */
      ${primaryColorForThemeHslString ? `--ring: ${primaryColorForThemeHslString};` : ''}
      ${primaryColorForThemeHslString ? `--chart-1: ${primaryColorForThemeHslString};` : ''}
    }
  `;

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="facebook-domain-verification" content="7dowgwz24hni45q2fjdp19cp0ztgzn" />
        
        <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />

        {whitelabelConfig.googleAnalyticsId && whitelabelConfig.googleAnalyticsId.trim() !== "" && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${whitelabelConfig.googleAnalyticsId.trim()}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${whitelabelConfig.googleAnalyticsId.trim()}', {
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
