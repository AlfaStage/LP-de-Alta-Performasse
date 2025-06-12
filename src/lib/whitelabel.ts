
import { promises as fs } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

const defaultConfig: WhitelabelConfig = {
  projectName: "Ice Lazer Quiz System",
  logoUrl: "https://placehold.co/150x50.png?text=Logo",
  primaryColorHex: "#E09677", 
  secondaryColorHex: "#F5D4C6", 
  pageBackgroundColorHex: "#F5B9A9", // Default page background from original globals.css accent
  quizBackgroundColorHex: "#FFFFFF", // Default card background (white)
  quizSubmissionWebhookUrl: "",
  facebookPixelId: "",
  facebookPixelIdSecondary: "",
  googleAnalyticsId: ""
};

async function ensureConfigFileExists() {
  try {
    await fs.access(configFilePath);
  } catch (error) {
    try {
      await fs.writeFile(configFilePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      console.log('Created default whitelabel-config.json');
    } catch (writeError) {
      console.error('Failed to write default whitelabel-config.json:', writeError);
    }
  }
}

export async function getWhitelabelConfig(): Promise<WhitelabelConfig> {
  await ensureConfigFileExists(); 
  try {
    const fileContents = await fs.readFile(configFilePath, 'utf8');
    const config = JSON.parse(fileContents) as WhitelabelConfig;
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.warn('Failed to read or parse whitelabel-config.json, returning default config:', error);
    return { ...defaultConfig }; 
  }
}

export async function saveWhitelabelConfig(newConfig: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  try {
    await fs.writeFile(configFilePath, JSON.stringify(newConfig, null, 2), 'utf8');
    return { success: true, message: 'Configurações Whitelabel salvas com sucesso!' };
  } catch (error) {
    console.error('Failed to save whitelabel-config.json:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao salvar configurações: ${errorMessage}` };
  }
}

export function hexToHslString(hexInput: string): string | null {
  if (!hexInput) return null;
  const hex = String(hexInput); // Ensure it's a string

  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (!shortResult) return null;
    result = [
      shortResult[0],
      shortResult[1] + shortResult[1],
      shortResult[2] + shortResult[2],
      shortResult[3] + shortResult[3],
    ] as RegExpExecArray; 
  }

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h: number = 0, s: number = 0, l: number = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
  } else {
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
