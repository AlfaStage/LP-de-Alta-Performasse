
import { promises as fs } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';
import crypto from 'crypto';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

export const defaultConfig: WhitelabelConfig = {
  projectName: "Sistema de Quiz Interativo",
  logoUrl: "https://placehold.co/150x50.png?text=Sua+Logo",
  primaryColorHex: "#3B82F6", 
  secondaryColorHex: "#BFDBFE", 
  buttonPrimaryBgColorHex: "#2563EB", 
  pageBackgroundColorHex: "#F3F4F6", 
  quizBackgroundColorHex: "#FFFFFF",
  pageBackgroundImageUrl: "",
  pageBackgroundGradient: "",
  pageBackgroundType: "color",
  quizSubmissionWebhookUrl: "YOUR_QUIZ_SUBMISSION_WEBHOOK_URL_PLACEHOLDER",
  disqualifiedSubmissionWebhookUrl: "",
  facebookPixelId: "",
  facebookPixelIdSecondary: "",
  googleAnalyticsId: "",
  
  aiProvider: 'google',
  googleApiKey: "",
  openAiApiKey: "",
  openAiBaseUrl: "",
  aiModel: "googleai/gemini-1.5-flash",

  footerCopyrightText: "© {YEAR} Seu Nome/Empresa. Todos os direitos reservados.",
  apiStatsAccessToken: "",
  websiteUrl: "", 
  instagramUrl: "", 
  facebookDomainVerification: "",
  dashboardDefaultFilter: "last7",
  conversionMetric: "start_vs_complete",
};

async function ensureConfigFileExists() {
  try {
    await fs.access(configFilePath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(configFilePath), { recursive: true });
      const initialConfig = { ...defaultConfig };
      // Replace {YEAR} placeholder in footerCopyrightText
      initialConfig.footerCopyrightText = initialConfig.footerCopyrightText.replace('{YEAR}', new Date().getFullYear().toString());
      await fs.writeFile(configFilePath, JSON.stringify(initialConfig, null, 2), 'utf8');
      console.log('Created default whitelabel-config.json at:', configFilePath);
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
    
    const mergedConfig: WhitelabelConfig = { ...defaultConfig, ...savedConfig };
    
    // Replace {YEAR} placeholder if it exists
    if (mergedConfig.footerCopyrightText?.includes('{YEAR}')) {
        mergedConfig.footerCopyrightText = mergedConfig.footerCopyrightText.replace('{YEAR}', new Date().getFullYear().toString());
    }

    return mergedConfig;

  } catch (error) {
    console.warn('Failed to read or parse whitelabel-config.json, returning default config:', error);
    const dynamicDefaultConfig = {...defaultConfig};
    if (dynamicDefaultConfig.footerCopyrightText) {
      dynamicDefaultConfig.footerCopyrightText = dynamicDefaultConfig.footerCopyrightText.replace('{YEAR}', new Date().getFullYear().toString());
    }
    return dynamicDefaultConfig; 
  }
}

export async function saveWhitelabelConfig(newConfig: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  try {
    // Ensure {YEAR} placeholder is preserved if it was there
    let footerTextToSave = newConfig.footerCopyrightText || defaultConfig.footerCopyrightText;
    if (footerTextToSave && !footerTextToSave.includes('{YEAR}')) {
        const currentYear = new Date().getFullYear().toString();
        if (footerTextToSave.includes(currentYear)) {
            footerTextToSave = footerTextToSave.replace(currentYear, '{YEAR}');
        }
    }

    const dataToSave = { ...newConfig, footerCopyrightText: footerTextToSave };
    await fs.writeFile(configFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    return { success: true, message: 'Configurações Whitelabel salvas com sucesso!' };
  } catch (error) {
    console.error('Failed to save whitelabel-config.json:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao salvar configurações: ${errorMessage}` };
  }
}


export async function generateNewApiToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}

// This function is kept for simplicity, but the logic is moved to the actions file
// to handle different providers.
export async function listGoogleAiModels(): Promise<string[]> {
    return [];
}
