
"use server";
import { login as loginUser, logout as logoutUser } from '@/lib/authService';
import { redirect } from 'next/navigation';
import { APP_BASE_URL } from '@/config/appConfig';

export async function loginAction(password: string): Promise<{ success: boolean; message?: string }> {
  return await loginUser(password);
}

export async function logoutAction() {
  await logoutUser();
  redirect(`${APP_BASE_URL}/config/login`);
}
