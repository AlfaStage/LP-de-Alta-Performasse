
import { promises as fs } from 'fs';
import path from 'path';
import type { AiPromptsConfig } from '@/types/quiz';

const promptsFilePath = path.join(process.cwd(), 'src', 'data', 'ai-prompts.json');

export const defaultPrompts: AiPromptsConfig = {
  generateQuizDetails: "You are a marketing copywriter. Based on the provided topic, generate a concise and engaging 'title', 'dashboardName', and 'description' for a quiz. The 'slug' should be a URL-friendly version of the title (lowercase, no spaces, use hyphens). The mode is '{{generationMode}}'. The topic is: '{{topic}}'.\n\nIf the mode is 'improve' or 'complete', use the following existing data as a base: {{existingData}}.\n\nReturn ONLY a valid JSON object in the format: {\"title\": \"...\", \"dashboardName\": \"...\", \"slug\": \"...\", \"description\": \"...\"}",
  generateQuizQuestions: "You are an expert quiz creator. Based on the topic '{{topic}}', create an array of 3 to 5 quiz questions. The final question MUST be of type 'textFields' to collect the user's name, WhatsApp, and email (use field names: 'nomeCompleto', 'whatsapp', 'email'). Vary the other questions between 'radio' and 'checkbox'. Use valid icon names from 'lucide-react' for all icons.\n\nReturn ONLY a valid JSON object with a single key \"questions\" containing the array of question objects. Example: {\"questions\": [ ... ]}",
  generateQuizMessages: "You are a friendly and engaging chatbot persona specialist. Based on the quiz topic '{{topic}}', create a sequence of 2-3 post-quiz messages to be sent via webhook. The messages can be of type 'mensagem' (text). You can use variables like {{nomeCompleto}} to personalize the message.\n\nReturn ONLY a valid JSON object with a single key \"messages\" containing the array of message objects. Example: {\"messages\": [ ... ]}",
  generateQuizResultsPages: "You are a skilled UX copywriter. Based on the quiz topic '{{topic}}', write two distinct pieces of text: \n1. 'successPageText': An encouraging message for qualified leads who completed the quiz successfully.\n2. 'disqualifiedPageText': A polite and professional message for users who were disqualified based on their answers.\n\nReturn ONLY a valid JSON object in the format: {\"successPageText\": \"...\", \"disqualifiedPageText\": \"...\"}"
};


async function ensurePromptsFileExists() {
  try {
    await fs.access(promptsFilePath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(promptsFilePath), { recursive: true });
      await fs.writeFile(promptsFilePath, JSON.stringify(defaultPrompts, null, 2), 'utf8');
      console.log('Created default ai-prompts.json at:', promptsFilePath);
    } catch (writeError) {
      console.error('Failed to write default ai-prompts.json:', writeError);
    }
  }
}

export async function getAiPrompts(): Promise<AiPromptsConfig> {
  await ensurePromptsFileExists();
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
