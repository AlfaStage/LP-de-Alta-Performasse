
// GA_TRACKING_ID will be passed from RootLayout (read from whitelabel config)
// or directly used by RootLayout for gtag init.
// This file's GA_TRACKING_ID constant is no longer the primary source.

// Helper function to get GA_TRACKING_ID from whitelabel config if needed server-side,
// but mostly it will be available client-side via props or context.
// import { getWhitelabelConfig } from './whitelabel';

// export const GA_TRACKING_ID = async () => (await getWhitelabelConfig()).googleAnalyticsId; // Example for server-side

export const pageview = (url: URL, gaTrackingId?: string) => {
  if (!gaTrackingId) {
    // console.warn("Google Analytics Tracking ID not provided to pageview function. Pageview not sent.");
    return;
  }
  if (typeof window.gtag !== "function") {
    // console.warn("Google Analytics (gtag) not found. Pageview not sent for URL:", url.toString());
    return;
  }
  window.gtag("config", gaTrackingId, {
    page_path: url.pathname,
  });
};

type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any; 
};

export const event = ({ action, category, label, value, ...rest }: GTagEvent, gaTrackingId?: string) => {
  // The gaTrackingId should ideally be available globally client-side after init,
  // or passed around if needed for specific event calls.
  // For simplicity, we're not fetching it dynamically here for each event.
  // RootLayout's gtag('config', trackingId) should make it default.
  // If multiple GAs were supported, this would need the ID.

  // The GA_TRACKING_ID is implicitly used by gtag if configured globally.
  // If you need to ensure it's the whitelabel one for each event, you might need context.
  // For now, rely on the global config set by RootLayout.

  if (typeof window.gtag !== "function") {
    // console.warn(`Google Analytics (gtag) not found. Event "${action}" not sent.`);
    return;
  }
  // If gaTrackingId is not available during event call, gtag will use the one from config.
  // If you wanted to target a specific ID for an event:
  // const targetId = gaTrackingId || window.GA_TRACKING_ID_FROM_WHITELABEL (if set globally)
  // if (!targetId) { console.warn(...); return; }
  
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...rest,
  });
};
