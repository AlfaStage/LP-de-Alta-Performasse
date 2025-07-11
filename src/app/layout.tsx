
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getWhitelabelConfig } from '@/lib/whitelabel.server';
import { hexToHslString, getContrastingTextColorHsl } from '@/lib/whitelabel';
import { ClientOnlyToaster } from '@/components/ClientOnlyToaster';

export async function generateMetadata(): Promise<Metadata> {
  const whitelabelConfig = await getWhitelabelConfig();
  const metadataResult: Metadata = {
    title: whitelabelConfig.projectName || 'Sistema de Quiz Interativo',
    description: `Quiz interativo para qualificação de leads para ${whitelabelConfig.projectName || 'seu projeto'}.`,
  };

  if (whitelabelConfig.facebookDomainVerification && whitelabelConfig.facebookDomainVerification.trim() !== "") {
    metadataResult.other = {
      ...(metadataResult.other || {}),
      'facebook-domain-verification': whitelabelConfig.facebookDomainVerification.trim(),
    };
  }

  return metadataResult;
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

  const {
    primaryColorHex,
    secondaryColorHex,
    pageBackgroundColorHex,
    quizBackgroundColorHex,
    buttonPrimaryBgColorHex,
    pageBackgroundImageUrl,
    pageBackgroundGradient,
    pageBackgroundType,
  } = whitelabelConfig;

  // Convert all colors to HSL strings
  const themePrimaryColorHslString = primaryColorHex ? hexToHslString(primaryColorHex) : null;
  const secondaryColorHslString = secondaryColorHex ? hexToHslString(secondaryColorHex) : null;
  const pageBackgroundColorHslString = pageBackgroundColorHex ? hexToHslString(pageBackgroundColorHex) : null;
  const quizBackgroundColorHslString = quizBackgroundColorHex ? hexToHslString(quizBackgroundColorHex) : null;

  // Determine the final color for primary interactive elements (like buttons)
  const finalPrimaryInteractiveColorHex = buttonPrimaryBgColorHex?.trim() ? buttonPrimaryBgColorHex : primaryColorHex;
  const finalPrimaryInteractiveHsl = finalPrimaryInteractiveColorHex ? hexToHslString(finalPrimaryInteractiveColorHex) : themePrimaryColorHslString;

  // --- Automatic Contrast Calculation ---
  const primaryFgHsl = getContrastingTextColorHsl(finalPrimaryInteractiveColorHex);
  const secondaryFgHsl = getContrastingTextColorHsl(secondaryColorHex);
  const accentFgHsl = getContrastingTextColorHsl(secondaryColorHex); // Accent is based on secondary
  
  const accentColorHslString = secondaryColorHslString; 

  let dynamicStyles = `
    :root {
      ${pageBackgroundColorHslString ? `--background: ${pageBackgroundColorHslString};` : ''}
      ${quizBackgroundColorHslString ? `--card: ${quizBackgroundColorHslString};` : ''}
      ${finalPrimaryInteractiveHsl ? `--primary: ${finalPrimaryInteractiveHsl};` : ''}
      ${secondaryColorHslString ? `--secondary: ${secondaryColorHslString};` : ''}
      ${accentColorHslString ? `--accent: ${accentColorHslString};` : ''}
      
      /* Set automatically calculated foreground colors */
      ${primaryFgHsl ? `--primary-foreground: ${primaryFgHsl};` : ''}
      ${secondaryFgHsl ? `--secondary-foreground: ${secondaryFgHsl};` : ''}
      ${accentFgHsl ? `--accent-foreground: ${accentFgHsl};` : ''}

      ${themePrimaryColorHslString ? `--ring: ${themePrimaryColorHslString};` : ''}
      ${themePrimaryColorHslString ? `--chart-1: ${themePrimaryColorHslString};` : ''}
    }
  `;

  let bodyBackgroundStyles = '';
  if (pageBackgroundType === 'gradient' && pageBackgroundGradient?.trim()) {
    bodyBackgroundStyles = `body { background: ${pageBackgroundGradient.trim()}; }`;
  } else if (pageBackgroundType === 'image' && pageBackgroundImageUrl?.trim()) {
    bodyBackgroundStyles = `
      body {
        background-image: url('${pageBackgroundImageUrl.trim()}');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
      }
    `;
  }
  
  if (bodyBackgroundStyles) {
    dynamicStyles += bodyBackgroundStyles;
  }

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet" />
        
        <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      </head>
      <body className="font-body antialiased">
        {children}
        <ClientOnlyToaster />
      </body>
    </html>
  );
}
