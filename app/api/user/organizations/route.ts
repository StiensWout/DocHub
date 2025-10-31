import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserOrganizationMemberships } from '@/lib/workos/organizations';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/user/organizations
 * Get current user's organizations and associated teams
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

    // Get organization memberships
    const memberships = await getUserOrganizationMemberships(session.user.id);

    // Enrich with user's team from database
    // NOTE: Organizations are NOT teams
    // User belongs to 1 organization and 1 team (their role) within that org
    const organizationsWithTeams = await Promise.all(
      memberships.map(async (membership) => {
        // Handle role - it might be a string or an object
        let roleName = '';
        if (membership.role) {
          if (typeof membership.role === 'string') {
            roleName = membership.role;
          } else if (typeof membership.role === 'object') {
            roleName = (membership.role as any).slug || (membership.role as any).name || (membership.role as any).id || '';
          }
        }

        // Get the user's specific team (their role) within this organization
        let userTeam = null;
        if (roleName && roleName.trim() !== '' && roleName.toLowerCase() !== 'member') {
          const { data: team } = await supabaseAdmin
            .from('teams')
            .select('id, name')
            .eq('name', roleName.trim())
            .eq('parent_organization_id', membership.organizationId)
            .single();
          
          if (team) {
            userTeam = {
              id: team.id,
              name: team.name,
            };
          }
        }

        return {
          id: membership.organizationId,
          name: membership.organizationName,
          role: roleName,
          createdAt: membership.createdAt,
          // parentTeam is null - organizations are not teams
          parentTeam: null,
          // teams array contains ONLY the user's team (their role)
          teams: userTeam ? [userTeam] : [],
        };
      })
    );

    return NextResponse.json({
      organizations: organizationsWithTeams,
    });
  } catch (error: any) {
    console.error('Error getting user organizations:', error);
    return NextResponse.json(
      { error: 'Failed to get user organizations' },
      { status: 500 }
    );
  }
}

