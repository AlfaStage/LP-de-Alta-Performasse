
"use server";

import { getWhitelabelConfig, saveWhitelabelConfig as saveConfig } from '@/lib/whitelabel.server';
import type { WhitelabelConfig } from '@/types/quiz';
import { revalidatePath } from 'next/cache';

export async function fetchWhitelabelSettings(): Promise<WhitelabelConfig> {
  return await getWhitelabelConfig();
}

export async function saveWhitelabelSettings(settings: WhitelabelConfig): Promise<{ success: boolean; message?: string }> {
  const result = await saveConfig(settings);
  if (result.success) {
    // Revalidate paths that might be affected by whitelabel changes
    revalidatePath('/', 'layout'); // Revalidate all layouts and pages
  }
  return result;
}
