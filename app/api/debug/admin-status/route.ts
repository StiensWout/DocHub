import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserOrganizationMemberships } from '@/lib/workos/organizations';
import { isUserInAdminOrganization } from '@/lib/workos/team-sync';
import { isAdmin, getUserRole } from '@/lib/auth/user-groups';

/**
 * GET /api/debug/admin-status
 * Debug endpoint to check admin status and organization memberships
 * Helps troubleshoot admin role detection issues
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const adminOrgName = process.env.WORKOS_ADMIN_ORGANIZATION_NAME || 'admin';
    const useWorkOSGroups = process.env.WORKOS_USE_ORGANIZATIONS === 'true';

    // Get organization memberships
    const memberships = await getUserOrganizationMemberships(userId, true);
    
    // Check admin status via different methods
    const isInAdminOrg = await isUserInAdminOrganization(userId, memberships);
    const isAdminViaFunction = await isAdmin();
    const userRole = await getUserRole();

    // Find which organizations match admin name
    const matchingOrgs = memberships.filter(m => 
      m.organizationName.toLowerCase() === adminOrgName.toLowerCase()
    );

    return NextResponse.json({
      userId,
      configuration: {
        WORKOS_USE_ORGANIZATIONS: useWorkOSGroups,
        WORKOS_ADMIN_ORGANIZATION_NAME: adminOrgName,
      },
      organizationMemberships: memberships.map(m => ({
        id: m.organizationId,
        name: m.organizationName,
        role: m.role,
        matchesAdminName: m.organizationName.toLowerCase() === adminOrgName.toLowerCase(),
      })),
      adminStatus: {
        isInAdminOrganization: isInAdminOrg,
        isAdmin: isAdminViaFunction,
        role: userRole,
        matchingOrganizations: matchingOrgs.length,
      },
      debug: {
        expectedAdminOrgName: adminOrgName,
        foundMatchingOrgs: matchingOrgs.map(m => m.organizationName),
        allOrgNames: memberships.map(m => m.organizationName),
      },
    });
  } catch (error: any) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status', details: error.message },
      { status: 500 }
    );
  }
}

