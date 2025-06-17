
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import FacebookPixelScript from '@/components/FacebookPixelScript';
import Script from 'next/script';
import { getWhitelabelConfig } from '@/lib/whitelabel.server'; 
import { hexToHslString } from '@/lib/whitelabel';

export async function generateMetadata(): Promise<Metadata> {
  const whitelabelConfig = await getWhitelabelConfig();
  return {
    title: whitelabelConfig.projectName || 'Ice Lazer Lead Filter',
    description: `Quiz interativo para qualificação de leads para ${whitelabelConfig.projectName || 'Ice Lazer'}.`,
  };
}

export const viewport: Viewport = {
  themeColor: [ 
    { media: '(prefers-color-scheme: light)', color: 'white' }, 
    { media: '(prefers-color-scheme: dark)', color: 'black' },  
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const whitelabelConfig = await getWhitelabelConfig();

  const themePrimaryColorHslString = whitelabelConfig.primaryColorHex ? hexToHslString(whitelabelConfig.primaryColorHex) : null;
  const secondaryColorHslString = whitelabelConfig.secondaryColorHex ? hexToHslString(whitelabelConfig.secondaryColorHex) : null;
  const pageBackgroundColorHslString = whitelabelConfig.pageBackgroundColorHex ? hexToHslString(whitelabelConfig.pageBackgroundColorHex) : null;
  const quizBackgroundColorHslString = whitelabelConfig.quizBackgroundColorHex ? hexToHslString(whitelabelConfig.quizBackgroundColorHex) : null;
  
  let buttonSpecificPrimaryHslString: string | null = null;
  if (whitelabelConfig.buttonPrimaryBgColorHex && whitelabelConfig.buttonPrimaryBgColorHex.trim() !== "") {
    buttonSpecificPrimaryHslString = hexToHslString(whitelabelConfig.buttonPrimaryBgColorHex);
  }
  
  const finalPrimaryInteractiveHsl = buttonSpecificPrimaryHslString || themePrimaryColorHslString;

  const accentColorHslString = secondaryColorHslString; // --accent will follow --secondary

  const dynamicStyles = `
    :root {
      ${pageBackgroundColorHslString ? `--background: ${pageBackgroundColorHslString};` : ''}
      ${quizBackgroundColorHslString ? `--card: ${quizBackgroundColorHslString};` : ''}
      ${finalPrimaryInteractiveHsl ? `--primary: ${finalPrimaryInteractiveHsl};` : ''}
      ${secondaryColorHslString ? `--secondary: ${secondaryColorHslString};` : ''}
      ${accentColorHslString ? `--accent: ${accentColorHslString};` : ''}
      
      /* --ring and --chart-1 will consistently use the theme's primary color (not button color) */
      ${themePrimaryColorHslString ? `--ring: ${themePrimaryColorHslString};` : ''}
      ${themePrimaryColorHslString ? `--chart-1: ${themePrimaryColorHslString};` : ''}
    }
  `;

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet" />
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
