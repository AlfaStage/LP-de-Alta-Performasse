
// Configurações lidas de variáveis de ambiente.
// As variáveis NEXT_PUBLIC_ podem ser acessadas tanto no cliente quanto no servidor.
// As variáveis sem o prefixo NEXT_PUBLIC_ são apenas para o servidor.

// Facebook Pixel
export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "YOUR_PRIMARY_FACEBOOK_PIXEL_ID";
export const FACEBOOK_PIXEL_ID_SECONDARY = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_SECONDARY || "YOUR_SECONDARY_FACEBOOK_PIXEL_ID";

// Placeholders para verificar se os IDs dos pixels foram de fato configurados
const PRIMARY_PLACEHOLDER = "YOUR_PRIMARY_FACEBOOK_PIXEL_ID";
const SECONDARY_PLACEHOLDER = "YOUR_SECONDARY_FACEBOOK_PIXEL_ID"; // Deve ser diferente do placeholder primário

export const isPrimaryPixelConfigured = FACEBOOK_PIXEL_ID && FACEBOOK_PIXEL_ID !== PRIMARY_PLACEHOLDER;
export const isSecondaryPixelConfigured = FACEBOOK_PIXEL_ID_SECONDARY && FACEBOOK_PIXEL_ID_SECONDARY !== SECONDARY_PLACEHOLDER;

export const areAnyPixelsConfigured = (): boolean => {
  return isPrimaryPixelConfigured || isSecondaryPixelConfigured;
};

// Google Analytics
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || ""; // Ex: "G-XXXXXXXXXX"

// Webhooks
export const CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT || "YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL";
export const SERVER_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER || "YOUR_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL";
export const QUIZ_SUBMISSION_WEBHOOK_URL = process.env.QUIZ_SUBMISSION_WEBHOOK_URL || "https://webhook.workflow.alfastage.com.br/webhook/icelazerquiz-mensagem";

// Dashboard
export const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "A123456789@@";
export const AUTH_COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET || "your-super-secret-auth-cookie-secret-key-must-be-at-least-32-characters";
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "app-auth-token";

// App Base URL
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:9002";

// Validações importantes
if (process.env.NODE_ENV === 'production' && AUTH_COOKIE_SECRET === "your-super-secret-auth-cookie-secret-key-must-be-at-least-32-characters") {
  console.warn("CRITICAL SECURITY WARNING: AUTH_COOKIE_SECRET is not set to a secure, unique value in production!");
}
if (AUTH_COOKIE_SECRET.length < 32) {
    console.warn("SECURITY WARNING: AUTH_COOKIE_SECRET should be at least 32 characters long for security.");
}
