
// This file contains Whitelabel utility functions safe for client-side use.
// Server-side specific functions (using 'fs') are in 'whitelabel.server.ts'.

function hexToRgb(hexInput: string): { r: number, g: number, b: number } | null {
  if (!hexInput || typeof hexInput !== 'string') return null;
  const hex = hexInput.startsWith('#') ? hexInput.slice(1) : hexInput;
  
  // Handle shorthand hex codes (e.g., "#03F")
  if (hex.length === 3) {
    const shorthandRegex = /^([a-f\d])([a-f\d])([a-f\d])$/i;
    const result = shorthandRegex.exec(hex);
    if (!result) return null;
    return {
      r: parseInt(result[1] + result[1], 16),
      g: parseInt(result[2] + result[2], 16),
      b: parseInt(result[3] + result[3], 16)
    };
  }
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}


export function hexToHslString(hexInput: string): string | null {
  const rgb = hexToRgb(hexInput);
  if (!rgb) return null;

  let { r, g, b } = rgb;
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h: number = 0, s: number = 0, l: number = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}


/**
 * Calculates the perceived luminance of a color and returns the HSL string
 * for a contrasting color (black or white).
 * @param hexColor The background color in hex format.
 * @returns HSL string for either black or white.
 */
export function getContrastingTextColorHsl(hexColor: string | undefined): string | null {
  if (!hexColor) return null;
  const rgb = hexToRgb(hexColor);
  if (!rgb) return null;

  // Formula for perceived luminance (YIQ formula)
  const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  
  // Threshold can be adjusted, but 128 is a common midpoint for a 0-255 scale.
  // If luminance is high (light color), use dark text. Otherwise, use light text.
  const isLight = luminance > 128;

  if (isLight) {
    // Return HSL for a dark color (e.g., dark gray)
    return '20 30% 15%';
  } else {
    // Return HSL for a light color (e.g., off-white)
    return '0 0% 100%';
  }
}
