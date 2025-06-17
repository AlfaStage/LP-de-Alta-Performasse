
const PLACEHOLDER_GA_ID = "YOUR_GA_ID";

// For SPA navigations after initial load. Initial pageview is handled by gtag config in TrackingScriptsWrapper.
export const trackGaPageView = (url: URL, gaTrackingId?: string) => {
  if (!gaTrackingId || gaTrackingId.trim() === "" || gaTrackingId === PLACEHOLDER_GA_ID) {
    // console.warn('GA: Tracking ID not configured for PageView.');
    return;
  }
  if (typeof window.gtag !== "function") {
    // console.warn('GA: gtag function not found for PageView tracking.');
    return;
  }
  window.gtag("event", "page_view", { 
    page_path: url.pathname,
    page_location: url.href,
    page_title: document.title,
    send_to: gaTrackingId, // Ensures it's sent to the correct GA property
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
    // console.warn(`GA: gtag function not found for event: ${action}`);
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
  } else if (!gaTrackingId && process.env.NODE_ENV === 'development') {
      // console.warn(`GA: No explicit gaTrackingId provided for event ${action}, it will be sent to default configured ID(s).`);
  }
  
  window.gtag("event", action, eventParams);
};
    