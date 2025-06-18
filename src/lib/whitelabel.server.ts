
import { promises as fs } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';
import crypto from 'crypto';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

export const defaultConfig: WhitelabelConfig = {
  projectName: "Sistema de Quiz Whitelabel",
  logoUrl: "https://placehold.co/150x50.png?text=Sua+Logo",
  primaryColorHex: "#3B82F6", // Azul Padrão
  secondaryColorHex: "#BFDBFE", // Azul Claro Padrão
  buttonPrimaryBgColorHex: "#2563EB", // Azul Escuro Padrão para Botão
  pageBackgroundColorHex: "#F3F4F6", // Cinza Claro para Fundo da Página
  quizBackgroundColorHex: "#FFFFFF", // Branco para Fundo do Quiz
  quizSubmissionWebhookUrl: "YOUR_QUIZ_SUBMISSION_WEBHOOK_URL_PLACEHOLDER",
  facebookPixelId: "",
  facebookPixelIdSecondary: "",
  googleAnalyticsId: "",
  footerCopyrightText: `© ${new Date().getFullYear()} Seu Nome/Empresa. Todos os direitos reservados.`,
  apiStatsAccessToken: "",
  websiteUrl: "", 
  instagramUrl: "", 
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
    
    const mergedConfig = { 
      ...defaultConfig, 
      ...savedConfig 
    };
    
    mergedConfig.buttonPrimaryBgColorHex = typeof savedConfig.buttonPrimaryBgColorHex === 'string' ? savedConfig.buttonPrimaryBgColorHex : defaultConfig.buttonPrimaryBgColorHex;
    
    // Ensure footerCopyrightText is dynamic if it contains {YEAR}
    let footerTextToUse = (typeof savedConfig.footerCopyrightText === 'string' && savedConfig.footerCopyrightText.trim() !== "") ? savedConfig.footerCopyrightText : defaultConfig.footerCopyrightText;
    if (footerTextToUse.includes('{YEAR}')) {
        footerTextToUse = footerTextToUse.replace('{YEAR}', new Date().getFullYear().toString());
    }
    mergedConfig.footerCopyrightText = footerTextToUse;

    mergedConfig.facebookPixelId = typeof savedConfig.facebookPixelId === 'string' ? savedConfig.facebookPixelId : defaultConfig.facebookPixelId;
    mergedConfig.facebookPixelIdSecondary = typeof savedConfig.facebookPixelIdSecondary === 'string' ? savedConfig.facebookPixelIdSecondary : defaultConfig.facebookPixelIdSecondary;
    mergedConfig.googleAnalyticsId = typeof savedConfig.googleAnalyticsId === 'string' ? savedConfig.googleAnalyticsId : defaultConfig.googleAnalyticsId;
    mergedConfig.apiStatsAccessToken = typeof savedConfig.apiStatsAccessToken === 'string' ? savedConfig.apiStatsAccessToken : defaultConfig.apiStatsAccessToken;
    mergedConfig.websiteUrl = typeof savedConfig.websiteUrl === 'string' ? savedConfig.websiteUrl : defaultConfig.websiteUrl;
    mergedConfig.instagramUrl = typeof savedConfig.instagramUrl === 'string' ? savedConfig.instagramUrl : defaultConfig.instagramUrl;

    return mergedConfig as WhitelabelConfig;

  } catch (error) {
    console.warn('Failed to read or parse whitelabel-config.json, returning default config:', error);
    const dynamicDefaultConfig = {...defaultConfig};
    dynamicDefaultConfig.footerCopyrightText = dynamicDefaultConfig.footerCopyrightText.replace('{YEAR}', new Date().getFullYear().toString());
    return dynamicDefaultConfig; 
  }
}

export async function saveWhitelabelConfig(newConfig: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  try {
    // Ensure {YEAR} is persisted as a placeholder if present, or use the dynamic year if not.
    let footerTextToSave = newConfig.footerCopyrightText || defaultConfig.footerCopyrightText;
    if (!footerTextToSave.includes('{YEAR}')) {
        // If user manually removed {YEAR}, we respect that. If they entered a static year, that's fine too.
        // If it's empty or default, ensure default placeholder is used.
        if (!newConfig.footerCopyrightText || newConfig.footerCopyrightText === defaultConfig.footerCopyrightText.replace('{YEAR}', new Date().getFullYear().toString())) {
            footerTextToSave = defaultConfig.footerCopyrightText; // Persist with {YEAR}
        }
    }


    const dataToSave: WhitelabelConfig = {
        projectName: newConfig.projectName,
        logoUrl: newConfig.logoUrl,
        primaryColorHex: newConfig.primaryColorHex,
        secondaryColorHex: newConfig.secondaryColorHex,
        buttonPrimaryBgColorHex: typeof newConfig.buttonPrimaryBgColorHex === 'string' ? newConfig.buttonPrimaryBgColorHex : defaultConfig.buttonPrimaryBgColorHex,
        pageBackgroundColorHex: newConfig.pageBackgroundColorHex,
        quizBackgroundColorHex: newConfig.quizBackgroundColorHex,
        quizSubmissionWebhookUrl: newConfig.quizSubmissionWebhookUrl,
        facebookPixelId: typeof newConfig.facebookPixelId === 'string' ? newConfig.facebookPixelId : defaultConfig.facebookPixelId,
        facebookPixelIdSecondary: typeof newConfig.facebookPixelIdSecondary === 'string' ? newConfig.facebookPixelIdSecondary : defaultConfig.facebookPixelIdSecondary,
        googleAnalyticsId: typeof newConfig.googleAnalyticsId === 'string' ? newConfig.googleAnalyticsId : defaultConfig.googleAnalyticsId,
        footerCopyrightText: footerTextToSave,
        apiStatsAccessToken: typeof newConfig.apiStatsAccessToken === 'string' ? newConfig.apiStatsAccessToken : defaultConfig.apiStatsAccessToken,
        websiteUrl: typeof newConfig.websiteUrl === 'string' ? newConfig.websiteUrl : defaultConfig.websiteUrl,
        instagramUrl: typeof newConfig.instagramUrl === 'string' ? newConfig.instagramUrl : defaultConfig.instagramUrl,
    };

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

