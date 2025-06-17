
"use server";

import { getWhitelabelConfig, saveWhitelabelConfig as saveConfig, generateNewApiToken } from '@/lib/whitelabel.server';
import type { WhitelabelConfig } from '@/types/quiz';
import { revalidatePath } from 'next/cache';

export async function fetchWhitelabelSettings(): Promise<WhitelabelConfig> {
  return await getWhitelabelConfig();
}

export async function saveWhitelabelSettings(settings: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  const result = await saveConfig(settings);
  if (result.success) {
    revalidatePath('/', 'layout'); 
    revalidatePath('/config/dashboard/settings/documentation', 'page'); // Revalidate documentation page to reflect new token if generated
  }
  return result;
}

export async function generateApiStatsTokenAction(): Promise<{ success: boolean; message?: string; newToken?: string }> {
  try {
    const currentConfig = await getWhitelabelConfig();
    const newToken = await generateNewApiToken();
    
    const updatedConfig: WhitelabelConfig = {
      ...currentConfig,
      apiStatsAccessToken: newToken,
    };
    
    const saveResult = await saveConfig(updatedConfig);
    if (saveResult.success) {
      revalidatePath('/config/dashboard/settings/documentation', 'page');
      return { success: true, newToken: newToken, message: "Novo token de API gerado e salvo com sucesso!" };
    } else {
      return { success: false, message: saveResult.message || "Falha ao salvar o novo token." };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao gerar token.";
    console.error("Error generating API stats token:", error);
    return { success: false, message: errorMessage };
  }
}
