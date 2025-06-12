
import { promises as fs } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

const defaultConfig: WhitelabelConfig = {
  logoUrl: "https://placehold.co/150x50.png?text=Logo",
  primaryColorHsl: "210 40% 96.1%", // Default light blue
  secondaryColorHsl: "220 30% 90%", // Default lighter blue/gray
  quizSubmissionWebhookUrl: "",
  facebookPixelId: "",
  facebookPixelIdSecondary: "",
  googleAnalyticsId: ""
};

async function ensureConfigFileExists() {
  try {
    await fs.access(configFilePath);
  } catch (error) {
    // File doesn't exist, create it with default content
    try {
      await fs.writeFile(configFilePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      console.log('Created default whitelabel-config.json');
    } catch (writeError) {
      console.error('Failed to write default whitelabel-config.json:', writeError);
      // If we can't write the default, we'll just return the in-memory default later
    }
  }
}

export async function getWhitelabelConfig(): Promise<WhitelabelConfig> {
  await ensureConfigFileExists(); // Ensure file exists before trying to read
  try {
    const fileContents = await fs.readFile(configFilePath, 'utf8');
    const config = JSON.parse(fileContents) as WhitelabelConfig;
    // Merge with defaults to ensure all keys are present if file is partial
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.warn('Failed to read or parse whitelabel-config.json, returning default config:', error);
    return { ...defaultConfig }; // Return a copy of default
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
