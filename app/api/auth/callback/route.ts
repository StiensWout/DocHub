import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';
import { REDIRECT_URI } from '@/lib/workos/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin?error=missing_code', request.url));
  }

  try {
    // Exchange the authorization code for a session
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
    });

    // Create a response that redirects to home
    const response = NextResponse.redirect(new URL('/', request.url));

    // Set session cookies
    // Note: In production, these should be HTTP-only, secure cookies
    response.cookies.set('wos-session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    if (refreshToken) {
      response.cookies.set('wos-refresh-token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/signin?error=authentication_failed', request.url)
    );
  }
}

