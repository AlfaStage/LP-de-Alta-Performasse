
import { promises as fs } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

export const defaultConfig: WhitelabelConfig = {
  projectName: "Ice Lazer Quiz System",
  logoUrl: "https://placehold.co/150x50.png?text=Logo",
  primaryColorHex: "#E09677", 
  secondaryColorHex: "#F5D4C6", 
  buttonPrimaryBgColorHex: "", 
  pageBackgroundColorHex: "#FCEFEA", 
  quizBackgroundColorHex: "#FFFFFF", 
  quizSubmissionWebhookUrl: "",
  facebookPixelId: "",
  facebookPixelIdSecondary: "",
  googleAnalyticsId: "",
  footerCopyrightText: `© ${new Date().getFullYear()} Ice Lazer Quizzes. Todos os direitos reservados.`
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
    const savedConfig = JSON.parse(fileContents) as Partial<WhitelabelConfig>;
    
    // Start with defaults, then override with what's saved in the file.
    // This ensures all keys from defaultConfig are present, but saved values (including empty strings) take precedence.
    const mergedConfig = { 
      ...defaultConfig, 
      ...savedConfig 
    };

    // Explicitly handle optional fields that might be empty strings vs undefined vs default
    // The spread above should correctly handle empty strings from savedConfig overriding defaults.
    // This is more for ensuring the final object matches the WhitelabelConfig type structure if new optional fields are added to defaultConfig.

    // Ensure buttonPrimaryBgColorHex is a string, defaulting if savedConfig doesn't have it or it's not a string
     if (typeof savedConfig.buttonPrimaryBgColorHex === 'string') {
        mergedConfig.buttonPrimaryBgColorHex = savedConfig.buttonPrimaryBgColorHex;
    } else {
        mergedConfig.buttonPrimaryBgColorHex = defaultConfig.buttonPrimaryBgColorHex; // or "" if that's preferred for undefined
    }
    
    // Ensure footerCopyrightText
    if (typeof savedConfig.footerCopyrightText === 'string' && savedConfig.footerCopyrightText.trim() !== "") {
        mergedConfig.footerCopyrightText = savedConfig.footerCopyrightText;
    } else {
        mergedConfig.footerCopyrightText = defaultConfig.footerCopyrightText;
    }
    
    // Ensure pixel and GA IDs are strings, defaulting if not present or not strings in savedConfig
    mergedConfig.facebookPixelId = typeof savedConfig.facebookPixelId === 'string' ? savedConfig.facebookPixelId : defaultConfig.facebookPixelId;
    mergedConfig.facebookPixelIdSecondary = typeof savedConfig.facebookPixelIdSecondary === 'string' ? savedConfig.facebookPixelIdSecondary : defaultConfig.facebookPixelIdSecondary;
    mergedConfig.googleAnalyticsId = typeof savedConfig.googleAnalyticsId === 'string' ? savedConfig.googleAnalyticsId : defaultConfig.googleAnalyticsId;


    return mergedConfig as WhitelabelConfig; // Cast to WhitelabelConfig to ensure all fields are there

  } catch (error) {
    console.warn('Failed to read or parse whitelabel-config.json, returning default config:', error);
    // Ensure returned default also matches the type structure perfectly for optional fields.
    return { ...defaultConfig }; 
  }
}

export async function saveWhitelabelConfig(newConfig: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  try {
    // Construct the object to save, ensuring all fields from WhitelabelConfig are present.
    // Values from newConfig (form data) take precedence.
    // For optional fields, if newConfig provides a string (even empty), use it. Otherwise, fall back to defaultConfig.
    const dataToSave: WhitelabelConfig = {
        projectName: newConfig.projectName,
        logoUrl: newConfig.logoUrl,
        primaryColorHex: newConfig.primaryColorHex,
        secondaryColorHex: newConfig.secondaryColorHex,
        buttonPrimaryBgColorHex: typeof newConfig.buttonPrimaryBgColorHex === 'string' ? newConfig.buttonPrimaryBgColorHex : defaultConfig.buttonPrimaryBgColorHex,
        pageBackgroundColorHex: newConfig.pageBackgroundColorHex,
        quizBackgroundColorHex: newConfig.quizBackgroundColorHex,
        quizSubmissionWebhookUrl: newConfig.quizSubmissionWebhookUrl, // This is required by Zod, so it will be present
        facebookPixelId: typeof newConfig.facebookPixelId === 'string' ? newConfig.facebookPixelId : defaultConfig.facebookPixelId,
        facebookPixelIdSecondary: typeof newConfig.facebookPixelIdSecondary === 'string' ? newConfig.facebookPixelIdSecondary : defaultConfig.facebookPixelIdSecondary,
        googleAnalyticsId: typeof newConfig.googleAnalyticsId === 'string' ? newConfig.googleAnalyticsId : defaultConfig.googleAnalyticsId,
        footerCopyrightText: (typeof newConfig.footerCopyrightText === 'string' && newConfig.footerCopyrightText.trim() !== "") ? newConfig.footerCopyrightText : defaultConfig.footerCopyrightText,
    };

    await fs.writeFile(configFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    return { success: true, message: 'Configurações Whitelabel salvas com sucesso!' };
  } catch (error) {
    console.error('Failed to save whitelabel-config.json:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao salvar configurações: ${errorMessage}` };
  }
}
