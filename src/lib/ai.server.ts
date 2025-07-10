
import { promises as fs } from 'fs';
import path from 'path';
import type { AiPromptsConfig, WhitelabelConfig } from '@/types/quiz';

const promptsFilePath = path.join(process.cwd(), 'src', 'data', 'ai-prompts.json');
const whitelabelConfigPath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');

export const defaultPrompts: AiPromptsConfig = {
  generateQuizDetails: "You are a marketing copywriter. Your task is to generate the details for a quiz: 'title', 'dashboardName', 'slug', and 'description'.\n\nThe generation mode is '{{generationMode}}'. The user's primary instruction or topic is: '{{topic}}'.\nAll other existing quiz data is provided for context in this JSON object: {{existingData}}.\n\n- If mode is 'overwrite', create everything from scratch based on the topic.\n- If mode is 'improve', refine the existing details based on the instruction.\n- If mode is 'complete', fill in any missing details based on the topic and existing context.\n\nMake the slug URL-friendly (lowercase, hyphens, no special characters).",
  generateQuizQuestions: "You are an expert quiz creator and instructional designer. Your task is to generate a JSON array of quiz questions.\n\nThe generation mode is '{{generationMode}}'. The user's primary instruction or topic is: '{{topic}}'.\nAll other existing quiz data (like title and description) is provided for context in this JSON object: {{existingData}}.\n\n- If mode is 'overwrite', create 3-5 questions from scratch. The last question must be type 'textFields' for contact info (nomeCompleto, whatsapp, email).\n- If mode is 'improve', refine the existing questions based on the instruction.\n- If mode is 'complete', add 1-2 new relevant questions to the existing ones.\n\nUse valid and relevant icon names from 'lucide-react' for all icons.",
  generateQuizMessages: "You are a friendly and engaging chatbot persona specialist. Your task is to generate a JSON array of post-quiz messages to be sent via webhook.\n\nThe generation mode is '{{generationMode}}'. The user's primary instruction or topic is: '{{topic}}'.\nAll other existing quiz data is provided for context in this JSON object: {{existingData}}.\n\n- If mode is 'overwrite', create 2-3 messages from scratch.\n- If mode is 'improve' or 'complete', refine or add to the existing messages based on the instruction.\n\nYou can use variables like {{nomeCompleto}} to personalize the message.",
  generateQuizResultsPages: "You are a skilled UX copywriter. Your task is to generate the text for quiz result pages.\n\nThe generation mode is '{{generationMode}}'. The user's primary instruction or topic is: '{{topic}}'.\nAll other existing quiz data is provided for context in this JSON object: {{existingData}}.\n\n- If mode is 'overwrite', write new 'successPageText' and 'disqualifiedPageText' from scratch.\n- If mode is 'improve' or 'complete', refine the existing text based on the instruction."
};


async function ensureFileExists(filePath: string, defaultContent: object) {
  try {
    await fs.access(filePath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
    } catch (writeError) {
      console.error(`Failed to write default file at ${filePath}:`, writeError);
    }
  }
}

export async function getAiPrompts(): Promise<AiPromptsConfig> {
  await ensureFileExists(promptsFilePath, defaultPrompts);
  try {
    const fileContents = await fs.readFile(promptsFilePath, 'utf8');
    const savedPrompts = JSON.parse(fileContents) as Partial<AiPromptsConfig>;
    return { ...defaultPrompts, ...savedPrompts };
  } catch (error) {
    console.warn('Failed to read or parse ai-prompts.json, returning default prompts:', error);
    return defaultPrompts;
  }
}

export async function saveAiPrompts(newPrompts: AiPromptsConfig): Promise<{ success: boolean; message?: string }> {
  try {
    await fs.writeFile(promptsFilePath, JSON.stringify(newPrompts, null, 2), 'utf8');
    return { success: true, message: 'Prompts de IA salvos com sucesso!' };
  } catch (error) {
    console.error('Failed to save ai-prompts.json:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao salvar prompts: ${errorMessage}` };
  }
}

// Helper to get whitelabel config on the server, as it's needed by the AI flow.
export async function getWhitelabelConfig(): Promise<Partial<WhitelabelConfig>> {
    try {
        await fs.access(whitelabelConfigPath);
        const fileContents = await fs.readFile(whitelabelConfigPath, 'utf8');
        return JSON.parse(fileContents) as Partial<WhitelabelConfig>;
    } catch {
        return {}; // Return empty object if file doesn't exist
    }
}
