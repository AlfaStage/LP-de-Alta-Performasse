
"use server";

import type { AiPromptsConfig } from '@/types/quiz';
import { getAiPrompts, saveAiPrompts } from '@/lib/ai.server';
import { revalidatePath } from 'next/cache';

export async function fetchAiPrompts(): Promise<AiPromptsConfig> {
  return await getAiPrompts();
}

export async function savePromptsAction(prompts: AiPromptsConfig): Promise<{ success: boolean; message?: string }> {
  const result = await saveAiPrompts(prompts);
  if (result.success) {
    // No specific path needs revalidation for this, as the prompt is read JIT in the flow.
    // However, if we had a page displaying the prompt, we would revalidate it here.
  }
  return result;
}
