
// Configurações lidas de variáveis de ambiente.
// As variáveis NEXT_PUBLIC_ podem ser acessadas tanto no cliente quanto no servidor.
// As variáveis sem o prefixo NEXT_PUBLIC_ são apenas para o servidor.

export const CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT || "YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL_PLACEHOLDER";
export const SERVER_SIDE_ABANDONMENT_WEBHOOK_URL = process.env.QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER || "YOUR_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL_PLACEHOLDER";

// Dashboard Authentication (Remains Environment Variables)
export const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "admin123"; // Generic default, emphasize changing via ENV
export const AUTH_COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET || "your-super-secret-auth-cookie-secret-key-must-be-at-least-32-characters";
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "app-auth-token";

// App Base URL (Environment Specific - NOT part of whitelabel UI)
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:9002";

// Validações importantes (mantidas para auth settings)
// É responsabilidade do desenvolvedor configurar isso corretamente em produção.

// API_STATS_ACCESS_TOKEN foi movido para whitelabel-config.json
// e é gerenciado pela UI na página de documentação.
