
"use server";

// This file is no longer needed as its functionality has been merged
// into `/src/app/config/dashboard/settings/actions.ts`.
// It is kept temporarily to avoid build errors if other components still import from it.
// It can be safely deleted once all imports are updated.
import type { AiPromptsConfig } from '@/types/quiz';
import { getAiPrompts, saveAiPrompts } from '@/lib/ai.server';

export async function fetchAiPrompts(): Promise<AiPromptsConfig> {
  return await getAiPrompts();
}

export async function savePromptsAction(prompts: AiPromptsConfig): Promise<{ success: boolean; message?: string }> {
  return await saveAiPrompts(prompts);
}
