
export const GA_TRACKING_ID = "G-YV9GYV3385";

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: URL) => {
  if (typeof window.gtag !== "function") {
    console.warn("Google Analytics (gtag) not found. Pageview not sent for URL:", url.toString());
    return;
  }
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any; // Allow other parameters
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value, ...rest }: GTagEvent) => {
  if (typeof window.gtag !== "function") {
    console.warn(`Google Analytics (gtag) not found. Event "${action}" not sent.`);
    return;
  }
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...rest, // Send any other parameters
  });
};
