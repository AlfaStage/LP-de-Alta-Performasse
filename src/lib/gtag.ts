
const PLACEHOLDER_GA_ID = "YOUR_GA_ID";

// For SPA navigations after initial load. Initial pageview is handled by gtag config in TrackingScriptsWrapper.
export const trackGaPageView = (url: URL, gaTrackingId?: string) => {
  if (!gaTrackingId || gaTrackingId.trim() === "" || gaTrackingId === PLACEHOLDER_GA_ID) {
    return;
  }
  if (typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", "page_view", { 
    page_path: url.pathname,
    page_location: url.href,
    page_title: document.title,
    send_to: gaTrackingId,
  });
};

type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any; 
};

export const trackGaEvent = ({ action, category, label, value, ...rest }: GTagEvent, gaTrackingId?: string) => {
  if (typeof window.gtag !== "function") {
    return;
  }
  const eventParams: Record<string, any> = { ...rest };
  if (category) eventParams.event_category = category;
  if (label) eventParams.event_label = label;
  if (value !== undefined) eventParams.value = value;
  
  // If gaTrackingId is provided and valid, ensure event is sent to it.
  // Otherwise, it will go to the default GA ID configured in gtag('config', ...).
  if (gaTrackingId && gaTrackingId.trim() !== "" && gaTrackingId !== PLACEHOLDER_GA_ID) {
    eventParams.send_to = gaTrackingId;
  }
  
  window.gtag("event", action, eventParams);
};

    