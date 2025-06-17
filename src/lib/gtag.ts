
// GA_TRACKING_ID will be passed from RootLayout (read from whitelabel config)
// or directly used by RootLayout for gtag init.

export const pageview = (url: URL, gaTrackingId?: string) => {
  if (!gaTrackingId || gaTrackingId.trim() === "" || gaTrackingId === "YOUR_GA_ID") {
    return;
  }
  if (typeof window.gtag !== "function") {
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

export const event = ({ action, category, label, value, ...rest }: GTagEvent) => {
  if (typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...rest,
  });
};
