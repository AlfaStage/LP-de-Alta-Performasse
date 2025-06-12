
import { 
  FACEBOOK_PIXEL_ID as ENV_FACEBOOK_PIXEL_ID,
  FACEBOOK_PIXEL_ID_SECONDARY as ENV_FACEBOOK_PIXEL_ID_SECONDARY,
  isPrimaryPixelConfigured as envIsPrimaryPixelConfigured,
  isSecondaryPixelConfigured as envIsSecondaryPixelConfigured,
  areAnyPixelsConfigured as envAreAnyPixelsConfigured
} from './appConfig';

export const FACEBOOK_PIXEL_ID = ENV_FACEBOOK_PIXEL_ID;
export const FACEBOOK_PIXEL_ID_SECONDARY = ENV_FACEBOOK_PIXEL_ID_SECONDARY;

export const isPrimaryPixelConfigured = envIsPrimaryPixelConfigured;
export const isSecondaryPixelConfigured = envIsSecondaryPixelConfigured;

export const areAnyPixelsConfigured = envAreAnyPixelsConfigured;
