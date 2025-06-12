
// Configurações lidas de variáveis de ambiente.
// As variáveis NEXT_PUBLIC_ podem ser acessadas tanto no cliente quanto no servidor.
// As variáveis sem o prefixo NEXT_PUBLIC_ são apenas para o servidor.

// Whitelabel settings (like Pixels, GA ID, specific webhooks) are now primarily managed 
// via src/lib/whitelabel.ts and whitelabel-config.json.
// This file will hold settings NOT typically part of whitelabel UI, or provide fallbacks if needed.

// Facebook Pixel & GA: These will be dynamically loaded by RootLayout from whitelabel config.
// For any server-side logic that might still need them directly (rare),
// it should call getWhitelabelConfig().
// For client-side, they are passed via props from RootLayout to FacebookPixelScript.

// Webhooks
// Client-side abandonment webhook can still be an env var if not made whitelabel.
export const CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT || "YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL";
// Server-side abandonment webhook (used in server actions) can also be an env var.
export const SERVER_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER || "YOUR_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL";
// Quiz Submission Webhook is now from whitelabel-config.json (see src/app/actions.ts)

// Dashboard Authentication (Remains Environment Variables)
export const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "A123456789@@";
export const AUTH_COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET || "your-super-secret-auth-cookie-secret-key-must-be-at-least-32-characters";
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "app-auth-token";

// App Base URL (Environment Specific - NOT part of whitelabel UI)
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:9002";

// Google Analytics ID - This specific constant is deprecated here.
// Use whitelabelConfig.googleAnalyticsId from getWhitelabelConfig() or props.
// export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || ""; // Ex: "G-XXXXXXXXXX"

// Facebook Pixel IDs - These specific constants are deprecated here.
// Use whitelabelConfig.facebookPixelId etc.
// export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "YOUR_PRIMARY_FACEBOOK_PIXEL_ID";
// export const FACEBOOK_PIXEL_ID_SECONDARY = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_SECONDARY || "YOUR_SECONDARY_FACEBOOK_PIXEL_ID";

// Validações importantes (mantidas para auth settings)
if (process.env.NODE_ENV === 'production' && AUTH_COOKIE_SECRET === "your-super-secret-auth-cookie-secret-key-must-be-at-least-32-characters") {
  console.warn("CRITICAL SECURITY WARNING: AUTH_COOKIE_SECRET is not set to a secure, unique value in production!");
}
if (AUTH_COOKIE_SECRET.length < 32) {
    console.warn("SECURITY WARNING: AUTH_COOKIE_SECRET should be at least 32 characters long for security.");
}

// Note: The functions like isPrimaryPixelConfigured, areAnyPixelsConfigured that were here
// are now effectively handled within FacebookPixelScript.tsx based on the props it receives,
// or by checking the whitelabelConfig directly.
