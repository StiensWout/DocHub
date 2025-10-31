import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin, getUserRole } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserOrganizationMemberships, updateUserRoleInOrganization } from '@/lib/workos/organizations';
import { log } from '@/lib/logger';

/**
 * GET /api/users/role
 * Get current user's role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // If userId is specified, check if user is admin
    if (userId) {
      const userIsAdmin = await isAdmin();
      if (!userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        log.error('Error fetching user role:', error);
        return NextResponse.json({ error: 'Failed to get user role' }, { status: 500 });
      }

      return NextResponse.json({ role: data?.role || 'user' });
    }

    // Otherwise return current user's role
    const role = await getUserRole(session.user.id);

    return NextResponse.json({ role });
  } catch (error: any) {
    log.error('Error getting user role:', error);
    return NextResponse.json(
      { error: 'Failed to get user role' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/role
 * Set user role (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'userId and role (admin or user) are required' },
        { status: 400 }
      );
    }

    // Update database role
    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      log.error('Error setting user role in database:', error);
      return NextResponse.json(
        { error: 'Failed to set user role in database' },
        { status: 500 }
      );
    }

    // Also update WorkOS organization membership role if using WorkOS Organizations
    const useWorkOSGroups = process.env.WORKOS_USE_ORGANIZATIONS === 'true';
    if (useWorkOSGroups) {
      try {
        log.debug(`[POST /api/users/role] Updating WorkOS organization membership role for user ${userId}`);
        
        // Get user's organization memberships
        const memberships = await getUserOrganizationMemberships(userId, true);
        
        if (memberships.length === 0) {
          log.warn(`[POST /api/users/role] User ${userId} has no organization memberships, skipping WorkOS update`);
        } else {
          // Update role in all organizations the user belongs to
          // Typically users belong to one organization, but we'll update all
          const updatePromises = memberships.map(membership => 
            updateUserRoleInOrganization(userId, membership.organizationId, role)
          );
          
          const results = await Promise.allSettled(updatePromises);
          
          // Check if any updates failed
          const failures = results.filter(r => r.status === 'rejected' || 
            (r.status === 'fulfilled' && !r.value.success));
          
          if (failures.length > 0) {
            log.error(`[POST /api/users/role] Some WorkOS role updates failed:`, failures);
            // Don't fail the entire request - database role was updated successfully
            // Just log the warning
          } else {
            log.info(`[POST /api/users/role] ✅ Successfully updated WorkOS roles in ${memberships.length} organization(s)`);
          }
        }
      } catch (error: any) {
        // Log but don't fail - database role was updated successfully
        log.error('[POST /api/users/role] Error updating WorkOS organization membership role:', error);
        log.warn('[POST /api/users/role] Database role updated, but WorkOS role update failed. User may need to re-login for changes to take effect.');
      }
    }

    return NextResponse.json({ 
      success: true,
      message: useWorkOSGroups 
        ? 'Role updated in database and WorkOS' 
        : 'Role updated in database' 
    });
  } catch (error: any) {
    log.error('Error setting user role:', error);
    return NextResponse.json(
      { error: 'Failed to set user role' },
      { status: 500 }
    );
  }
}

