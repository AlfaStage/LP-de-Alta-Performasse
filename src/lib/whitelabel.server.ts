
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
    const config = JSON.parse(fileContents) as WhitelabelConfig;
    const mergedConfig = { ...defaultConfig, ...config };
    
    if (typeof mergedConfig.buttonPrimaryBgColorHex === 'undefined') {
        mergedConfig.buttonPrimaryBgColorHex = "";
    }
    if (typeof mergedConfig.footerCopyrightText === 'undefined' || mergedConfig.footerCopyrightText.trim() === "") {
        mergedConfig.footerCopyrightText = defaultConfig.footerCopyrightText;
    }
    return mergedConfig;
  } catch (error) {
    console.warn('Failed to read or parse whitelabel-config.json, returning default config:', error);
    return { ...defaultConfig, buttonPrimaryBgColorHex: defaultConfig.buttonPrimaryBgColorHex || "", footerCopyrightText: defaultConfig.footerCopyrightText }; 
  }
}

export async function saveWhitelabelConfig(newConfig: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  try {
    const configToSave = { ...defaultConfig, ...newConfig };
     if (typeof configToSave.buttonPrimaryBgColorHex === 'undefined') {
        configToSave.buttonPrimaryBgColorHex = "";
    }
    if (typeof configToSave.footerCopyrightText === 'undefined' || configToSave.footerCopyrightText.trim() === "") {
        configToSave.footerCopyrightText = defaultConfig.footerCopyrightText;
    }
    await fs.writeFile(configFilePath, JSON.stringify(configToSave, null, 2), 'utf8');
    return { success: true, message: 'Configurações Whitelabel salvas com sucesso!' };
  } catch (error) {
    console.error('Failed to save whitelabel-config.json:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao salvar configurações: ${errorMessage}` };
  }
}
