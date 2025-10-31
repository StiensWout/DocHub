import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin, getAllUsers } from '@/lib/auth/user-groups';
import { workos } from '@/lib/workos/server';
import { getUserOrganizationMemberships } from '@/lib/workos/organizations';

/**
 * GET /api/users/all
 * Get all users in the organization (admin only)
 * Enriched with WorkOS profile data and organization memberships
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

    // Get users from database
    const users = await getAllUsers();

    // Enrich with WorkOS profile data and organization memberships
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Get user profile from WorkOS
          let userProfile = null;
          try {
            const workosUser = await workos.userManagement.getUser(user.userId);
            userProfile = {
              email: workosUser.email,
              firstName: workosUser.firstName,
              lastName: workosUser.lastName,
              emailVerified: workosUser.emailVerified,
            };
          } catch (error: any) {
            // User might be SSO user, not User Management user
            console.warn(`Could not fetch WorkOS user ${user.userId}:`, error.message);
          }

          // Get organization memberships
          let memberships: any[] = [];
          try {
            memberships = await getUserOrganizationMemberships(user.userId, true);
          } catch (error: any) {
            console.warn(`Could not fetch memberships for user ${user.userId}:`, error.message);
          }

          return {
            ...user,
            email: userProfile?.email || user.email,
            firstName: userProfile?.firstName,
            lastName: userProfile?.lastName,
            emailVerified: userProfile?.emailVerified || false,
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

