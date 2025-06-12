
import { GA_TRACKING_ID as ENV_GA_TRACKING_ID } from '@/config/appConfig';

export const GA_TRACKING_ID = ENV_GA_TRACKING_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: URL) => {
  if (!GA_TRACKING_ID) {
    console.warn("Google Analytics Tracking ID not configured. Pageview not sent.");
    return;
  }
  if (typeof window.gtag !== "function") {
    console.warn("Google Analytics (gtag) not found. Pageview not sent for URL:", url.toString());
    return;
  }
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url.pathname, // Use pathname to be consistent
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
  if (!GA_TRACKING_ID) {
    console.warn(`Google Analytics Tracking ID not configured. Event "${action}" not sent.`);
    return;
  }
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
