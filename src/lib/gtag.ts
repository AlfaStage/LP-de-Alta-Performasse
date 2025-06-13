
// GA_TRACKING_ID will be passed from RootLayout (read from whitelabel config)
// or directly used by RootLayout for gtag init.
// This file's GA_TRACKING_ID constant is no longer the primary source.

export const pageview = (url: URL, gaTrackingId?: string) => {
  if (!gaTrackingId || gaTrackingId.trim() === "" || gaTrackingId === "YOUR_GA_ID") {
    // console.warn("Google Analytics Tracking ID not provided or is placeholder. Pageview not sent for URL:", url.toString());
    return;
  }
  if (typeof window.gtag !== "function") {
    // console.warn("Google Analytics (gtag) not found. Pageview not sent for URL:", url.toString());
    return;
  }
  // console.log(`GA: Sending pageview for ${url.pathname} with ID ${gaTrackingId}`);
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

export const event = ({ action, category, label, value, ...rest }: GTagEvent) => {
  // GA_TRACKING_ID é configurado globalmente no layout.tsx, gtag irá usá-lo.
  // Não é necessário passar o ID aqui para cada evento, a menos que haja múltiplos rastreadores.
  if (typeof window.gtag !== "function") {
    // console.warn(`Google Analytics (gtag) not found. Event "${action}" not sent.`);
    return;
  }
  // console.log(`GA: Sending event "${action}" with params:`, { category, label, value, ...rest });
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...rest,
  });
};
