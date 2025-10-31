import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin, getAllUsers } from '@/lib/auth/user-groups';
import { getUserOrganizationMemberships } from '@/lib/workos/organizations';
import { getAllLocalUsers } from '@/lib/workos/user-sync';

/**
 * GET /api/users/all
 * Get all users (admin only)
 * Uses local database for fast access, enriched with organization memberships
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get users from local database (includes roles and groups)
    const users = await getAllUsers();
    
    // Get all local user records for additional profile data
    const localUsers = await getAllLocalUsers();
    const localUsersMap = new Map(localUsers.map(u => [u.workos_user_id, u]));

    // Enrich with local profile data and organization memberships
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Get local user profile data
          const localUser = localUsersMap.get(user.userId);
          
          // Get organization memberships
          let memberships: any[] = [];
          try {
            memberships = await getUserOrganizationMemberships(user.userId, true);
          } catch (error: any) {
            console.warn(`Could not fetch memberships for user ${user.userId}:`, error.message);
          }

          return {
            ...user,
            email: localUser?.email || user.email,
            firstName: localUser?.first_name,
            lastName: localUser?.last_name,
            emailVerified: localUser?.email_verified || false,
            profilePictureUrl: localUser?.profile_picture_url,
            lastSyncedAt: localUser?.last_synced_at,
            organizations: memberships.map(m => ({
              id: m.organizationId,
              name: m.organizationName,
              role: typeof m.role === 'string' ? m.role : (m.role as any)?.slug || (m.role as any)?.name || '',
            })),
          };
        } catch (error: any) {
          console.error(`Error enriching user ${user.userId}:`, error);
          return user;
        }
      })
    );

    return NextResponse.json({ users: enrichedUsers });
  } catch (error: any) {
    console.error('Error getting all users:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

