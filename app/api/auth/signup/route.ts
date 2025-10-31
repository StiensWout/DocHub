import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create new user in WorkOS
    const user = await workos.userManagement.createUser({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      emailVerified: false, // Will need email verification
    });

    // Authenticate the newly created user
    const { accessToken, refreshToken } = await workos.userManagement.authenticateWithPassword({
      email,
      password,
      clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
    });

    // Create response
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      }
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
    console.error('Sign up error:', error);
    
    // Handle WorkOS errors
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    if (error.message?.includes('password')) {
      return NextResponse.json(
        { error: 'Password does not meet requirements' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

