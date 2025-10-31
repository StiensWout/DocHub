import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, pendingAuthenticationToken } = body;

    if (!code && !pendingAuthenticationToken) {
      return NextResponse.json(
        { error: 'Verification code and pending authentication token are required' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    if (!pendingAuthenticationToken) {
      return NextResponse.json(
        { error: 'Pending authentication token is required' },
        { status: 400 }
      );
    }

    // Verify email with code and authenticate using pending authentication token
    // WorkOS uses authenticateWithEmailVerification with code parameter
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithEmailVerification({
      code,
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
  } catch (error: any) {
    console.error('Email verification error:', error);
    
    if (error.status === 400 || error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please check the code and try again.' },
        { status: 400 }
      );
    }

    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Verification code not found. Please request a new code.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    );
  }
}

