
"use server";

import { getWhitelabelConfig, saveWhitelabelConfig as saveConfig, generateNewApiToken } from '@/lib/whitelabel.server';
import type { AiPromptsConfig, WhitelabelConfig } from '@/types/quiz';
import { revalidatePath } from 'next/cache';
import { getAiPrompts, saveAiPrompts } from '@/lib/ai.server';

export async function fetchWhitelabelSettings(): Promise<WhitelabelConfig> {
  return await getWhitelabelConfig();
}

export async function saveWhitelabelSettings(settings: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  const result = await saveConfig(settings);
  if (result.success) {
    revalidatePath('/', 'layout'); 
    revalidatePath('/config/dashboard/documentation', 'page');
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

export async function deleteApiStatsTokenAction(): Promise<{ success: boolean; message?: string }> {
  try {
    const currentConfig = await getWhitelabelConfig();
    const updatedConfig: WhitelabelConfig = {
      ...currentConfig,
      apiStatsAccessToken: "", // Set token to empty string
    };

    const saveResult = await saveConfig(updatedConfig);
    if (saveResult.success) {
      revalidatePath('/config/dashboard/settings/documentation', 'page');
      return { success: true, message: "Token de API excluído com sucesso." };
    } else {
      return { success: false, message: saveResult.message || "Falha ao excluir o token da API." };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao excluir token.";
    console.error("Error deleting API stats token:", error);
    return { success: false, message: errorMessage };
  }
}

interface ListModelsParams {
    provider: 'google' | 'openai';
    apiKey?: string;
    baseUrl?: string;
}

export async function listAvailableAiModelsAction(params: ListModelsParams): Promise<{ success: boolean; models?: string[]; message?: string }> {
  const { provider, apiKey, baseUrl } = params;
  if (!apiKey) {
    return { success: false, message: 'Chave de API não fornecida.' };
  }

  if (provider === 'google') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da API do Google: ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      const modelNames = data.models
        .filter((model: any) => model.supportedGenerationMethods.includes('generateContent') && model.name.includes('gemini'))
        .map((model: any) => `googleai/${model.name.split('/')[1]}`);
      return { success: true, models: [...new Set(modelNames)] as string[] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao listar modelos do Google.";
      console.error("Erro ao listar modelos do Google:", error);
      return { success: false, message: errorMessage };
    }
  } else if (provider === 'openai') {
    try {
      const finalBaseUrl = baseUrl || 'https://api.openai.com/v1';
      const response = await fetch(`${finalBaseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da API OpenAI: ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      const modelNames = data.data
        .map((model: any) => `openai/${model.id}`)
        .filter((name: string) => name.includes('gpt'));
      return { success: true, models: [...new Set(modelNames)] as string[] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao listar modelos da OpenAI.";
      console.error("Erro ao listar modelos da OpenAI:", error);
      return { success: false, message: errorMessage };
    }
  }
  return { success: false, message: "Provedor de IA inválido." };
}

export async function testAiConnectionAction(params: ListModelsParams): Promise<{ success: boolean; message: string }> {
    const result = await listAvailableAiModelsAction(params);
    if (result.success && result.models && result.models.length > 0) {
        return { success: true, message: `Conexão bem-sucedida! ${result.models.length} modelo(s) encontrado(s).` };
    } else if (result.success) {
        return { success: false, message: "Conexão bem-sucedida, mas nenhum modelo compatível foi encontrado." };
    } else {
        return { success: false, message: `Falha na conexão: ${result.message}` };
    }
}


// --- AI Prompts Actions ---
export async function fetchAiPrompts(): Promise<AiPromptsConfig> {
  return await getAiPrompts();
}

export async function savePromptsAction(prompts: AiPromptsConfig): Promise<{ success: boolean; message?: string }> {
  const result = await saveAiPrompts(prompts);
  if (result.success) {
    // No specific path needs revalidation for this, as the prompt is read JIT in the flow.
  }
  return result;
}
