
// Configurações lidas de variáveis de ambiente.
// As variáveis NEXT_PUBLIC_ podem ser acessadas tanto no cliente quanto no servidor.
// As variáveis sem o prefixo NEXT_PUBLIC_ são apenas para o servidor.

// Client-side abandonment webhook can still be an env var if not made whitelabel.
export const CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT || "YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL";
// Server-side abandonment webhook (used in server actions) can also be an env var.
export const SERVER_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER || "YOUR_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL";

// Dashboard Authentication (Remains Environment Variables)
export const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "A123456789@@";
export const AUTH_COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET || "your-super-secret-auth-cookie-secret-key-must-be-at-least-32-characters";
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "app-auth-token";

// App Base URL (Environment Specific - NOT part of whitelabel UI)
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:9002";

// Validações importantes (mantidas para auth settings)
if (process.env.NODE_ENV === 'production' && AUTH_COOKIE_SECRET === "your-super-secret-auth-cookie-secret-key-must-be-at-least-32-characters") {
  console.warn("CRITICAL SECURITY WARNING: AUTH_COOKIE_SECRET is not set to a secure, unique value in production!");
}
if (AUTH_COOKIE_SECRET.length < 32) {
    console.warn("SECURITY WARNING: AUTH_COOKIE_SECRET should be at least 32 characters long for security.");
}

// API_STATS_ACCESS_TOKEN foi movido para whitelabel-config.json
// e é gerenciado pela UI na página de documentação.

