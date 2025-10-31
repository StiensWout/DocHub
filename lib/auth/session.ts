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
 */
export async function getSession(): Promise<{ user: SessionUser; accessToken: string } | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('wos-session')?.value;

    if (!accessToken) {
      return null;
    }

    // Get user from the access token
    // The access token contains user information
    const user = await workos.userManagement.getUser(accessToken);

    if (!user) {
      return null;
    }

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
  } catch (error) {
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

