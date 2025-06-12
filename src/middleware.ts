
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/authService'; // Assuming getSession can be adapted or a similar check exists
import { AUTH_COOKIE_NAME, APP_BASE_URL } from '@/config/appConfig';

async function isUserAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  // In a real app with jose, you'd decrypt and validate the token here.
  // For simplicity, we're just checking for presence.
  // If using jose, `getSession` might involve `jwtVerify`.
  // This simplified check is NOT secure for production without actual token validation.
  // The getSession function in authService.ts does validation with jose.
  // However, middleware runs in Edge runtime, which has some limitations.
  // For a robust solution, consider NextAuth.js or ensure jose works in Edge.

  // Placeholder for actual decryption/validation logic if not using a full getSession that works in Edge
  // This example assumes a simplified check. For a production app, full validation is needed.
  // For now, let's assume if a cookie exists, it's "valid" for this middleware example.
  // A better check:
  try {
    const session = await getSession(); // This uses jose, ensure it works in Edge or use a simpler check
    return !!session;
  } catch (e) {
    console.error("Middleware auth check error", e); // Should not happen if getSession handles errors
    return false;
  }
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /config/dashboard/** routes
  if (pathname.startsWith('/config/dashboard')) {
    const isAuthenticated = await isUserAuthenticated(request);
    if (!isAuthenticated) {
      const loginUrl = new URL('/config/login', APP_BASE_URL || request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // If user is authenticated and tries to access /config/login, redirect to dashboard
  if (pathname === ('/config/login')) {
      const isAuthenticated = await isUserAuthenticated(request);
      if (isAuthenticated) {
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
