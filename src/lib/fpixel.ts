
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

// Track PageView. For SPAs, after the initial load, this should track subsequent views.
// The initial PageView is handled by the script in FacebookPixelScript.tsx.
export const trackPageView = () => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    return;
  }
  // For subsequent SPA page views, a global PageView event is often sufficient
  // as all relevant pixels should have been initialized.
  (window as any).fbq('track', 'PageView');
};

// Track standard events for specific pixel IDs
export const trackEvent = (name: string, options = {}, pixelIdsToTrack?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    return;
  }
  
  if (pixelIdsToTrack && pixelIdsToTrack.length > 0) {
    pixelIdsToTrack.forEach(id => {
      (window as any).fbq('trackSingle', id, name, options);
    });
  }
};

// Track custom events for specific pixel IDs
export const trackCustomEvent = (name: string, options = {}, pixelIdsToTrack?: string[]) => {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    return;
  }

  if (pixelIdsToTrack && pixelIdsToTrack.length > 0) {
    pixelIdsToTrack.forEach(id => {
      (window as any).fbq('trackSingleCustom', id, name, options);
    });
  }
};
