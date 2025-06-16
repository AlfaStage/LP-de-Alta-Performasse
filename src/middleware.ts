
import { type NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/authService'; 
import { AUTH_COOKIE_NAME, APP_BASE_URL } from '@/config/appConfig';

async function isUserAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    // console.log('[Middleware] No auth token found in cookies.');
    return false;
  }

  try {
    const decryptedPayload = await decrypt(token);
    // console.log('[Middleware] Decrypted payload:', decryptedPayload);
    return !!decryptedPayload;
  } catch (e) {
    // console.error("[Middleware] Error during token decryption:", e);
    return false;
  }
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // console.log(`[Middleware] Path: ${pathname}, Auth Cookie: ${request.cookies.get(AUTH_COOKIE_NAME)?.value ? 'Present' : 'Absent'}`);

  // Protect /config/dashboard/** routes
  if (pathname.startsWith('/config/dashboard')) {
    const isAuthenticated = await isUserAuthenticated(request);
    // console.log(`[Middleware] Accessing ${pathname}, IsAuthenticated: ${isAuthenticated}`);
    if (!isAuthenticated) {
      const loginUrl = new URL('/config/login', APP_BASE_URL || request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      // console.log(`[Middleware] Not authenticated, redirecting to: ${loginUrl.toString()}`);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // If user is authenticated and tries to access /config/login, redirect to dashboard
  if (pathname === ('/config/login')) {
      const isAuthenticated = await isUserAuthenticated(request);
      // console.log(`[Middleware] Accessing /config/login, IsAuthenticated: ${isAuthenticated}`);
      if (isAuthenticated) {
          // console.log('[Middleware] Authenticated user accessing /config/login, redirecting to dashboard.');
          return NextResponse.redirect(new URL('/config/dashboard', APP_BASE_URL || request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets folder)
     * - images (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images).*)',
    '/config/dashboard/:path*',
    '/config/login',
  ],
};

