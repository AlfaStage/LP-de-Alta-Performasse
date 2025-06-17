
import { promises as fs } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

// IMPORTANT PRODUCTION NOTE:
// Writing to the local filesystem (like this whitelabel-config.json file) at runtime
// is NOT SUITABLE for most PaaS/serverless hosting environments (e.g., Firebase App Hosting, Vercel)
// as their filesystems are often ephemeral or read-only after deployment.
// For production, dynamic configurations like these should be stored in a
// persistent database (e.g., Firestore, PostgreSQL, MySQL) or a dedicated config service.
// This implementation is suitable for local development or environments with persistent writable storage.

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
      // Ensure the directory exists before writing the file
      await fs.mkdir(path.dirname(configFilePath), { recursive: true });
      await fs.writeFile(configFilePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
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

     if (typeof savedConfig.buttonPrimaryBgColorHex === 'string') {
        mergedConfig.buttonPrimaryBgColorHex = savedConfig.buttonPrimaryBgColorHex;
    } else {
        mergedConfig.buttonPrimaryBgColorHex = defaultConfig.buttonPrimaryBgColorHex; 
    }
    
    if (typeof savedConfig.footerCopyrightText === 'string' && savedConfig.footerCopyrightText.trim() !== "") {
        mergedConfig.footerCopyrightText = savedConfig.footerCopyrightText;
    } else {
        mergedConfig.footerCopyrightText = defaultConfig.footerCopyrightText;
    }
    
    mergedConfig.facebookPixelId = typeof savedConfig.facebookPixelId === 'string' ? savedConfig.facebookPixelId : defaultConfig.facebookPixelId;
    mergedConfig.facebookPixelIdSecondary = typeof savedConfig.facebookPixelIdSecondary === 'string' ? savedConfig.facebookPixelIdSecondary : defaultConfig.facebookPixelIdSecondary;
    mergedConfig.googleAnalyticsId = typeof savedConfig.googleAnalyticsId === 'string' ? savedConfig.googleAnalyticsId : defaultConfig.googleAnalyticsId;

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
    };

    await fs.writeFile(configFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    return { success: true, message: 'Configurações Whitelabel salvas com sucesso!' };
  } catch (error) {
    console.error('Failed to save whitelabel-config.json:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao salvar configurações: ${errorMessage}` };
  }
}
