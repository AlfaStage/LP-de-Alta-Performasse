
export const FACEBOOK_PIXEL_ID = "724967076682767"; // Primary Pixel ID
export const FACEBOOK_PIXEL_ID_SECONDARY = "3949746165337932"; // Secondary Pixel ID

// Placeholders to check against
const PRIMARY_PLACEHOLDER = "YOUR_FACEBOOK_PIXEL_ID";
const SECONDARY_PLACEHOLDER = "YOUR_FACEBOOK_PIXEL_ID_SECONDARY_PLACEHOLDER"; // A distinct placeholder

export const isPrimaryPixelConfigured = FACEBOOK_PIXEL_ID && FACEBOOK_PIXEL_ID !== PRIMARY_PLACEHOLDER;
export const isSecondaryPixelConfigured = FACEBOOK_PIXEL_ID_SECONDARY && FACEBOOK_PIXEL_ID_SECONDARY !== SECONDARY_PLACEHOLDER;

export const areAnyPixelsConfigured = (): boolean => {
  return isPrimaryPixelConfigured || isSecondaryPixelConfigured;
};
