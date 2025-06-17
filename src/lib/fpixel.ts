
// Constants for placeholder IDs to avoid magic strings
const PLACEHOLDER_FB_PIXEL_ID = "YOUR_PRIMARY_FACEBOOK_PIXEL_ID";
const PLACEHOLDER_SECONDARY_FB_PIXEL_ID = "YOUR_SECONDARY_FACEBOOK_PIXEL_ID";

// Helper to get an array of active, valid pixel IDs
export function getActivePixelIds(primaryId?: string, secondaryId?: string): string[] {
  const ids: string[] = [];
  if (primaryId && primaryId.trim() !== "" && primaryId !== PLACEHOLDER_FB_PIXEL_ID) {
    ids.push(primaryId);
  }
  if (secondaryId && secondaryId.trim() !== "" && secondaryId !== PLACEHOLDER_SECONDARY_FB_PIXEL_ID) {
    ids.push(secondaryId);
  }
  return ids;
}

// Track PageView for specific pixel IDs.
// This is typically used for SPA navigations after the initial PageView.
export const trackPageView = (pixelIdsToTrack?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    // console.warn("FB Pixel: fbq not found. PageView not sent.");
    return;
  }

  if (pixelIdsToTrack && pixelIdsToTrack.length > 0) {
    pixelIdsToTrack.forEach(id => {
      (window as any).fbq('trackSingle', id, 'PageView');
      // console.log(`FB Pixel: Subsequent PageView sent to ${id}`);
    });
  } else {
    // console.warn("FB Pixel: trackPageView called without specific pixel IDs. No PageView sent by this function call.");
    // Avoid global fbq('track', 'PageView') here as it might double-count if not managed carefully with initial script.
  }
};

// Track standard events for specific pixel IDs
export const trackEvent = (name: string, options = {}, pixelIdsToTrack?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    // console.warn(`FB Pixel: fbq not found. Event "${name}" not sent.`);
    return;
  }
  
  if (pixelIdsToTrack && pixelIdsToTrack.length > 0) {
    pixelIdsToTrack.forEach(id => {
      (window as any).fbq('trackSingle', id, name, options);
      // console.log(`FB Pixel: Event "${name}" sent to ${id} with options:`, options);
    });
  } else {
    // console.warn(`FB Pixel: trackEvent "${name}" called without specific pixel IDs. No event sent by this function call.`);
  }
};

// Track custom events for specific pixel IDs
export const trackCustomEvent = (name: string, options = {}, pixelIdsToTrack?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    // console.warn(`FB Pixel: fbq not found. Custom Event "${name}" not sent.`);
    return;
  }

  if (pixelIdsToTrack && pixelIdsToTrack.length > 0) {
    pixelIdsToTrack.forEach(id => {
      (window as any).fbq('trackSingleCustom', id, name, options);
      // console.log(`FB Pixel: Custom Event "${name}" sent to ${id} with options:`, options);
    });
  } else {
    // console.warn(`FB Pixel: trackCustomEvent "${name}" called without specific pixel IDs. No custom event sent by this function call.`);
  }
};
