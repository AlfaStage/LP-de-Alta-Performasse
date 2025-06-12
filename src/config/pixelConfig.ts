
// This file's role is diminished as pixel configurations are now primarily sourced
// from whitelabel-config.json and passed down from RootLayout.

// The actual pixel IDs (FACEBOOK_PIXEL_ID, FACEBOOK_PIXEL_ID_SECONDARY)
// should be accessed from the whitelabel configuration passed to FacebookPixelScript.tsx.

// If you still need a centralized place for pixel-related logic (e.g. helper functions
// that don't depend on the specific ID values but on their presence), you can keep it here.
// However, functions like isPrimaryPixelConfigured, areAnyPixelsConfigured are now more
// naturally handled within FacebookPixelScript.tsx or by directly checking the whitelabel config
// object where it's available.

// Example: You might keep general pixel utility functions here if they become complex.
// For now, it's mostly superseded.

// console.log("pixelConfig.ts: Note - Pixel IDs are now primarily managed via Whitelabel settings.");

// The constants previously re-exported from appConfig are no longer the primary source.
// export const FACEBOOK_PIXEL_ID = ENV_FACEBOOK_PIXEL_ID; // Deprecated direct export
// export const FACEBOOK_PIXEL_ID_SECONDARY = ENV_FACEBOOK_PIXEL_ID_SECONDARY; // Deprecated

// export const isPrimaryPixelConfigured = envIsPrimaryPixelConfigured; // Deprecated
// export const isSecondaryPixelConfigured = envIsSecondaryPixelConfigured; // Deprecated
// export const areAnyPixelsConfigured = envAreAnyPixelsConfigured; // Deprecated
