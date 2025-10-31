import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, pendingAuthenticationToken } = body;

    if (!token && !pendingAuthenticationToken) {
      return NextResponse.json(
        { error: 'Verification token or pending authentication token is required' },
        { status: 400 }
      );
    }

    // Verify email and authenticate using pending authentication token
    if (pendingAuthenticationToken) {
      const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithEmailVerification({
        pendingAuthenticationToken,
        clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
        },
      });

      // Set session cookies
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
    }

    // Alternative: verify using email verification token directly
    // This might be used if WorkOS sends a different flow
    if (token) {
      // Use the token to verify email - exact method depends on WorkOS API
      // This is a placeholder - check WorkOS docs for exact implementation
      return NextResponse.json(
        { error: 'Token verification not yet implemented. Use pending authentication token.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid verification request' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Email verification error:', error);
    
    if (error.status === 400 || error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

