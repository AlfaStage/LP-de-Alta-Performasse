
import { promises as fs } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';
import crypto from 'crypto';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

export const defaultConfig: WhitelabelConfig = {
  projectName: "LP de Alta Performasse",
  logoUrl: "/logo-lp-alta-performasse.png",
  primaryColorHex: "#E09677", 
  secondaryColorHex: "#F5D4C6", 
  buttonPrimaryBgColorHex: "#FEC3A9", 
  pageBackgroundColorHex: "#FCEFEA", 
  quizBackgroundColorHex: "#FFFFFF", 
  quizSubmissionWebhookUrl: "https://webhook.workflow.alfastage.com.br/webhook/icelazerquiz-mensagem",
  facebookPixelId: "724967076682767",
  facebookPixelIdSecondary: "3949746165337932",
  googleAnalyticsId: "G-YV9GYV3385",
  footerCopyrightText: `© ${new Date().getFullYear()} LP de Alta Performasse. Todos os direitos reservados. Desenvolvido por FR Digital.`,
  apiStatsAccessToken: "",
  websiteUrl: "https://espacoicelaser.com", // Valor Padrão
  instagramUrl: "https://www.instagram.com/icelaseroficial/", // Valor Padrão
};

async function ensureConfigFileExists() {
  try {
    await fs.access(configFilePath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(configFilePath), { recursive: true });
      const initialConfig = { ...defaultConfig };
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
    mergedConfig.footerCopyrightText = (typeof savedConfig.footerCopyrightText === 'string' && savedConfig.footerCopyrightText.trim() !== "") ? savedConfig.footerCopyrightText : defaultConfig.footerCopyrightText;
    mergedConfig.facebookPixelId = typeof savedConfig.facebookPixelId === 'string' ? savedConfig.facebookPixelId : defaultConfig.facebookPixelId;
    mergedConfig.facebookPixelIdSecondary = typeof savedConfig.facebookPixelIdSecondary === 'string' ? savedConfig.facebookPixelIdSecondary : defaultConfig.facebookPixelIdSecondary;
    mergedConfig.googleAnalyticsId = typeof savedConfig.googleAnalyticsId === 'string' ? savedConfig.googleAnalyticsId : defaultConfig.googleAnalyticsId;
    mergedConfig.apiStatsAccessToken = typeof savedConfig.apiStatsAccessToken === 'string' ? savedConfig.apiStatsAccessToken : defaultConfig.apiStatsAccessToken;
    mergedConfig.websiteUrl = typeof savedConfig.websiteUrl === 'string' ? savedConfig.websiteUrl : defaultConfig.websiteUrl;
    mergedConfig.instagramUrl = typeof savedConfig.instagramUrl === 'string' ? savedConfig.instagramUrl : defaultConfig.instagramUrl;

    return mergedConfig as WhitelabelConfig;

  } catch (error) {
    console.warn('Failed to read or parse whitelabel-config.json, returning default config:', error);
    return { ...defaultConfig }; 
  }
}

export async function saveWhitelabelConfig(newConfig: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  try {
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
        footerCopyrightText: (typeof newConfig.footerCopyrightText === 'string' && newConfig.footerCopyrightText.trim() !== "") ? newConfig.footerCopyrightText : defaultConfig.footerCopyrightText,
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
