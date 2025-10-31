import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin, getAllUsers } from '@/lib/auth/user-groups';
import { workos } from '@/lib/workos/server';

/**
 * GET /api/users/all
 * Get all users in the organization (admin only)
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

    // Get users from WorkOS (SSO profiles)
    // Note: This requires WorkOS Directory Sync or manual tracking
    // For now, we'll use the database user_roles and user_groups tables
    
    const users = await getAllUsers();

    // Optionally enrich with WorkOS profile data
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Try to get profile from WorkOS
          // Note: This may require different API depending on how users are stored
          return {
            ...user,
            // Profile data can be added here if available from WorkOS
          };
        } catch (error) {
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

