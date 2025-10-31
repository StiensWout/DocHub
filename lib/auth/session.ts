import { cookies } from 'next/headers';
import { workos } from '@/lib/workos/server';

export interface SessionUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

/**
 * Get the current user session from WorkOS
 * Returns null if no valid session exists
 * 
 * Supports both SSO (organization-based) and User Management authentication
 */
export async function getSession(): Promise<{ user: SessionUser; accessToken: string } | null> {
  try {
    const cookieStore = await cookies();
    
    const accessToken = cookieStore.get('wos-session')?.value;

    if (!accessToken) {
      return null;
    }

    // NOTE: Token refresh is disabled for now
    // WorkOS tokens typically last long enough with the 7-day cookie expiration
    // If token refresh is needed, it should be implemented using WorkOS's session refresh API
    // For now, if the token is invalid, the user will need to re-authenticate

    // Try SSO profile first (for organization-based SSO)
    try {
      const profile = await workos.sso.getProfile({ accessToken });
      
      if (profile) {
        return {
          user: {
            id: profile.id,
            email: profile.email || '',
            firstName: profile.firstName || undefined,
            lastName: profile.lastName || undefined,
            profilePictureUrl: undefined, // SSO profiles don't have profilePictureUrl
          },
          accessToken,
        };
      }
    } catch (ssoError: any) {
      // If SSO fails, try User Management (for email/password or social OAuth)
      // Only log if it's not a "wrong token type" error
      if (ssoError.code !== 'invalid_token' && ssoError.message?.includes('token')) {
        console.log('Token is not SSO token, trying User Management...');
      }
      
      try {
        // For User Management tokens, we need to decode the JWT to get the user ID
        // The token contains a 'sub' claim with the user ID
        let userId: string | null = null;
        
        try {
          // Decode JWT token (without verification - we trust WorkOS tokens)
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            userId = payload.sub; // 'sub' claim contains the user ID
          }
        } catch (decodeError: any) {
          console.warn('Could not decode token to extract user ID:', decodeError.message);
        }

        if (!userId) {
          throw new Error('Could not extract user ID from token');
        }

        // Get user by ID
        const user = await workos.userManagement.getUser(userId);
        
        if (user) {
          return {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              profilePictureUrl: user.profilePictureUrl || undefined,
            },
            accessToken,
          };
        }
      } catch (userMgmtError: any) {
        // Neither SSO nor User Management worked
        console.error('Failed to get user from both SSO and User Management:', {
          ssoError: ssoError.message,
          userMgmtError: userMgmtError.message,
        });
        return null;
      }
    }

    return null;
  } catch (error: any) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if a user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Get the current user (throws if not authenticated)
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('User is not authenticated');
  }

  return session.user;
}

