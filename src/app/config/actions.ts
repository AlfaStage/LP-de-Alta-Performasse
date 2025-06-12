
"use server";
import { login as loginUser, logout as logoutUser } from '@/lib/authService';
import { redirect } from 'next/navigation';
// Removido APP_BASE_URL pois o redirect será para caminho relativo

export async function loginAction(password: string): Promise<{ success: boolean; message?: string }> {
  return await loginUser(password);
}

export async function logoutAction() {
  await logoutUser();
  redirect('/config/login');
}
