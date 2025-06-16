
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server'; // NextRequest e NextResponse não são usados diretamente aqui, mas podem ser úteis para referência de contexto
import { AUTH_COOKIE_SECRET, AUTH_COOKIE_NAME, DASHBOARD_PASSWORD } from '@/config/appConfig';

const secretKey = new TextEncoder().encode(AUTH_COOKIE_SECRET);

interface UserPayload {
  username: string; // In this simple case, username might just be 'admin'
  iat?: number;
  exp?: number;
}

export async function encrypt(payload: UserPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Aumentado para 8 horas
    .sign(secretKey);
}

export async function decrypt(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload as UserPayload;
  } catch (error) {
    // Não logar erros de verificação de token em produção como 'error' para não poluir logs,
    // a menos que seja em modo debug ou um erro inesperado do jose.
    // console.log('Token verification failed (expected for expired/invalid tokens):', error.name);
    return null;
  }
}

export async function login(password: string): Promise<{ success: boolean; message?: string }> {
  if (password === DASHBOARD_PASSWORD) {
    const userPayload: UserPayload = { username: 'admin' };
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas
    const session = await encrypt(userPayload);

    cookies().set(AUTH_COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      path: '/',
      sameSite: 'lax',
    });
    return { success: true };
  }
  return { success: false, message: 'Senha incorreta.' };
}

export async function logout() {
  cookies().delete(AUTH_COOKIE_NAME);
}

// Esta função é para Server Components e Server Actions
export async function getSession(): Promise<UserPayload | null> {
  const sessionCookie = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

// updateSession não é usada ativamente pelo middleware atual para renovar sessão.
// Se renovação automática fosse desejada, o middleware precisaria de uma lógica diferente.
// export async function updateSession(request: NextRequest) {
//   const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
//   if (!sessionCookie) return null;

//   const parsed = await decrypt(sessionCookie);
//   if (!parsed) return null;

//   parsed.exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60; // Extend by 8 hours
//   const res = NextResponse.next();
//   res.cookies.set({
//     name: AUTH_COOKIE_NAME,
//     value: await encrypt(parsed),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     expires: new Date(parsed.exp * 1000),
//     path: '/',
//     sameSite: 'lax',
//   });
//   return res;
// }

