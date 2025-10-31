import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get('wos-session')?.value;

  // If no session token and trying to access protected route, redirect to sign in
  // Only protect specific routes, not the root initially (let client handle it)
  const protectedRoutes = ['/documents', '/groups', '/api/files'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!sessionToken && isProtectedRoute) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes need to be accessible)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

