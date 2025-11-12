import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow ALL API routes to handle their own authentication
  // API routes should return JSON errors, not HTML redirects
  // This includes /api/auth/* which is handled by NextAuth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth sets this)
  const sessionToken = 
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  const isLoggedIn = !!sessionToken;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect logged-out users to login (except for auth pages)
  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints should not be protected by middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

