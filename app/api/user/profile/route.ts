import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserGroups, getUserRole, isAdmin } from '@/lib/auth/user-groups';
import { getUserOrganizationMemberships } from '@/lib/workos/organizations';
import { workos } from '@/lib/workos/server';

/**
 * GET /api/user/profile
 * Get current user's profile information including organizations and roles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details from WorkOS
    let userDetails;
    try {
      const user = await workos.userManagement.getUser(session.user.id);
      // Handle createdAt - it might be a Date object, string, or undefined
      let createdAtStr: string | undefined = undefined;
      if (user.createdAt) {
        const createdAt = user.createdAt as any;
        if (createdAt instanceof Date) {
          createdAtStr = createdAt.toISOString();
        } else if (typeof createdAt === 'string') {
          createdAtStr = createdAt;
        } else {
          try {
            createdAtStr = new Date(createdAt).toISOString();
          } catch {
            createdAtStr = undefined;
          }
        }
      }

      userDetails = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profilePictureUrl: user.profilePictureUrl || undefined,
        emailVerified: user.emailVerified || false,
        createdAt: createdAtStr,
      };
    } catch (error: any) {
      console.error('Error fetching user from WorkOS:', error);
      // Fallback to session data
      userDetails = {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        profilePictureUrl: session.user.profilePictureUrl,
      };
    }

    // Get user's groups
    const groups = await getUserGroups(session.user.id);

    // Get user's role
    const role = await getUserRole(session.user.id);

    // Get organization memberships with details
    const memberships = await getUserOrganizationMemberships(session.user.id);

    // Check if admin
    const userIsAdmin = await isAdmin();

    return NextResponse.json({
      user: userDetails,
      role,
      isAdmin: userIsAdmin,
      groups,
      organizations: memberships.map(m => {
        // Handle role - it might be a string or an object
        let roleName = '';
        if (m.role) {
          if (typeof m.role === 'string') {
            roleName = m.role;
          } else if (typeof m.role === 'object') {
            roleName = (m.role as any).slug || (m.role as any).name || (m.role as any).id || '';
          }
        }
        
        return {
          id: m.organizationId,
          name: m.organizationName,
          role: roleName,
          createdAt: m.createdAt,
        };
      }),
    });
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

