import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';
import { getUserGroups } from '@/lib/auth/user-groups';
import { syncUserFromWorkOS } from '@/lib/workos/user-sync';

/**
 * SSO Callback Handler
 * Handles the OAuth callback from WorkOS after user authentication
 * This route is at /auth/callback to match the redirect URI configuration
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    console.error('Callback missing authorization code');
    return NextResponse.redirect(new URL('/auth/signin?error=missing_code', request.url));
  }

  try {
    // Use SSO getProfileAndToken (works with any SSO provider via organization)
    // This is the correct method for organization-based SSO
    let user: any;
    let accessToken: string;
    let refreshToken: string | undefined;

    try {
      // Try SSO getProfileAndToken first (for SSO via organization/connection)
      const profileResult = await workos.sso.getProfileAndToken({
        code,
        clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
      });
      
      user = {
        id: profileResult.profile.id,
        email: profileResult.profile.email,
        firstName: profileResult.profile.firstName,
        lastName: profileResult.profile.lastName,
      };
      accessToken = profileResult.accessToken;
      refreshToken = profileResult.refreshToken;
      
      console.log('✅ SSO authentication successful:', { 
        userId: user.id, 
        email: user.email 
      });
    } catch (ssoError: any) {
      console.error('SSO getProfileAndToken error:', ssoError);
      
      // Fallback to userManagement for other OAuth flows (if needed)
      // This might be used for social providers or user management OAuth
      const authResult = await workos.userManagement.authenticateWithCode({
        code,
        clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
      });
      
      user = authResult.user;
      accessToken = authResult.accessToken;
      refreshToken = authResult.refreshToken;
      
      console.log('✅ User Management authentication successful:', { 
        userId: user.id, 
        email: user.email 
      });
    }

    // Sync user to local database immediately after authentication
    // This ensures user data is available for admin access even when user is offline
    try {
      console.log(`[callback] Syncing user ${user.id} to local database`);
      await syncUserFromWorkOS(user.id);
    } catch (syncError: any) {
      // Log but don't fail the authentication flow
      console.warn('[callback] Error syncing user to local database:', syncError.message);
    }

    // Sync teams from WorkOS organizations immediately after authentication
    // This ensures teams are created when user first logs in
    if (process.env.WORKOS_USE_ORGANIZATIONS === 'true') {
      try {
        console.log(`[callback] Syncing teams for user ${user.id} after authentication`);
        await getUserGroups(user.id);
      } catch (syncError: any) {
        // Log but don't fail the authentication flow
        console.warn('[callback] Error syncing teams after auth:', syncError.message);
      }
    }

    // Create a response that redirects to home
    const response = NextResponse.redirect(new URL('/', request.url));

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
    console.error('Auth callback error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });
    
    return NextResponse.redirect(
      new URL('/auth/signin?error=authentication_failed', request.url)
    );
  }
}

