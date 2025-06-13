
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

// Track PageView for specific pixel IDs
export const trackPageView = (pixelIds?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    // console.warn("FB Pixel: fbq not found. PageView not sent.");
    return;
  }

  const idsToTrack = pixelIds && pixelIds.length > 0 ? pixelIds : [];

  if (idsToTrack.length > 0) {
    idsToTrack.forEach(id => {
      (window as any).fbq('trackSingle', id, 'PageView');
      // console.log(`FB Pixel: PageView sent to ${id}`);
    });
  }
  // No global fallback here; initial PageView is handled by FacebookPixelScript init
};

// Track standard events for specific pixel IDs
export const trackEvent = (name: string, options = {}, pixelIds?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    // console.warn(`FB Pixel: fbq not found. Event "${name}" not sent.`);
    return;
  }
  const idsToTrack = pixelIds && pixelIds.length > 0 ? pixelIds : [];

  if (idsToTrack.length > 0) {
    idsToTrack.forEach(id => {
      (window as any).fbq('trackSingle', id, name, options);
      // console.log(`FB Pixel: Event "${name}" sent to ${id} with options:`, options);
    });
  }
  // No global fallback
};

// Track custom events for specific pixel IDs
export const trackCustomEvent = (name: string, options = {}, pixelIds?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    // console.warn(`FB Pixel: fbq not found. Custom Event "${name}" not sent.`);
    return;
  }
  const idsToTrack = pixelIds && pixelIds.length > 0 ? pixelIds : [];

  if (idsToTrack.length > 0) {
    idsToTrack.forEach(id => {
      (window as any).fbq('trackSingleCustom', id, name, options);
      // console.log(`FB Pixel: Custom Event "${name}" sent to ${id} with options:`, options);
    });
  }
  // No global fallback
};
