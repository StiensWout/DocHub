import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';
import { REDIRECT_URI } from '@/lib/workos/client';
import { getUserGroups } from '@/lib/auth/user-groups';
import { syncUserFromWorkOS } from '@/lib/workos/user-sync';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user with email and password
    // Note: Users created with email/password can belong to the same organization as SSO users
    // Organization membership is managed separately in WorkOS Dashboard or via API
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithPassword({
      email,
      password,
      clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
    });

    // Sync user to local database immediately after authentication
    // This ensures user data is available for admin access even when user is offline
    try {
      log.debug(`[signin] Syncing user ${user.id} to local database`);
      await syncUserFromWorkOS(user.id);
    } catch (syncError: any) {
      // Log but don't fail the authentication flow
      log.warn('[signin] Error syncing user to local database:', syncError.message);
    }

    // Sync teams from WorkOS organizations immediately after authentication
    // This ensures teams are created when user first logs in
    if (process.env.WORKOS_USE_ORGANIZATIONS === 'true') {
      try {
        log.debug(`[signin] Syncing teams for user ${user.id} after email/password authentication`);
        await getUserGroups(user.id);
      } catch (syncError: any) {
        // Log but don't fail the authentication flow
        log.warn('[signin] Error syncing teams after auth:', syncError.message);
      }
    }

    // Create response
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
    log.error('Sign in error:', error);
    
    // Handle WorkOS errors
    if (error.message?.includes('Invalid credentials')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    );
  }
}

