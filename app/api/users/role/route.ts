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
  let dbUpdateSuccess = false;
  let previousRole: string | null = null;
  let userIdForRollback: string | null = null;
  
  try {
    const session = await getSession();
    if (!session) {
      log.warn('[POST /api/users/role] Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info(`[POST /api/users/role] Role update request from user ${session.user.id}`);

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      log.warn(`[POST /api/users/role] Unauthorized: User ${session.user.id} is not admin`);
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;
    userIdForRollback = userId; // Store for potential rollback

    log.debug(`[POST /api/users/role] Request body - userId: ${userId}, role: ${role}`);
    
    // Check if the current user's role is being changed (for redirect/clear state logic)
    const isCurrentUserRoleChange = userId === session.user.id;
    log.debug(`[POST /api/users/role] Is current user role change: ${isCurrentUserRoleChange}`);

    if (!userId || !role || !['admin', 'user'].includes(role)) {
      log.warn(`[POST /api/users/role] Invalid request - userId: ${userId}, role: ${role}`);
      return NextResponse.json(
        { error: 'userId and role (admin or user) are required' },
        { status: 400 }
      );
    }

    // Get previous role for potential rollback
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    previousRole = existingRole?.role || null;
    log.debug(`[POST /api/users/role] Previous role for user ${userId}: ${previousRole || 'none'}`);

    // Update database role
    log.info(`[POST /api/users/role] Updating database role for user ${userId} to "${role}"`);
    const { error: dbError, data: dbData } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select();

    if (dbError) {
      log.error(`[POST /api/users/role] Database update failed:`, dbError);
      return NextResponse.json(
        { error: 'Failed to set user role in database', details: dbError.message },
        { status: 500 }
      );
    }

    dbUpdateSuccess = true;
    log.info(`[POST /api/users/role] ✅ Database role updated successfully`);

    // Also update WorkOS organization membership role if using WorkOS Organizations
    const useWorkOSGroups = process.env.WORKOS_USE_ORGANIZATIONS === 'true';
    log.debug(`[POST /api/users/role] WORKOS_USE_ORGANIZATIONS=${useWorkOSGroups}`);
    
    if (useWorkOSGroups) {
      try {
        log.info(`[POST /api/users/role] Updating WorkOS organization membership role for user ${userId}`);
        
        // Get user's organization memberships (don't use cache for role updates)
        const memberships = await getUserOrganizationMemberships(userId, false);
        log.debug(`[POST /api/users/role] Found ${memberships.length} organization memberships`);
        
        if (memberships.length === 0) {
          log.warn(`[POST /api/users/role] User ${userId} has no organization memberships, skipping WorkOS update`);
          // This is not necessarily an error - user might not be in any org yet
          return NextResponse.json({ 
            success: true,
            message: 'Role updated in database. User has no WorkOS organization memberships.',
            warning: 'User may need to be added to an organization for WorkOS role sync',
            currentUserRoleChanged: isCurrentUserRoleChange,
            roleChanged: role
          });
        } else {
          // Update role in all organizations the user belongs to
          log.info(`[POST /api/users/role] Updating role in ${memberships.length} organization(s)`);
          const updatePromises = memberships.map((membership, index) => {
            log.debug(`[POST /api/users/role] Updating role in org ${membership.organizationId} (${membership.organizationName})`);
            return updateUserRoleInOrganization(userId, membership.organizationId, role);
          });
          
          const results = await Promise.allSettled(updatePromises);
          
          // Check results
          const successes = results.filter(r => 
            r.status === 'fulfilled' && r.value.success
          );
          const failures = results.filter(r => 
            r.status === 'rejected' || 
            (r.status === 'fulfilled' && !r.value.success)
          );
          
          if (failures.length > 0) {
            log.error(`[POST /api/users/role] ⚠️ ${failures.length} out of ${results.length} WorkOS role updates failed`);
            
            // Log each failure
            failures.forEach((failure, index) => {
              if (failure.status === 'rejected') {
                log.error(`[POST /api/users/role] WorkOS update ${index + 1} rejected:`, failure.reason);
              } else if (failure.status === 'fulfilled') {
                log.error(`[POST /api/users/role] WorkOS update ${index + 1} failed:`, failure.value.error);
              }
            });
            
            // Rollback database update if all WorkOS updates failed
            if (successes.length === 0 && failures.length === memberships.length) {
              log.error(`[POST /api/users/role] All WorkOS updates failed - rolling back database change`);
              
              try {
                if (previousRole) {
                  // Restore previous role
                  await supabaseAdmin
                    .from('user_roles')
                    .upsert({
                      user_id: userId,
                      role: previousRole,
                      updated_at: new Date().toISOString(),
                    }, {
                      onConflict: 'user_id',
                    });
                  log.info(`[POST /api/users/role] ✅ Database rollback successful - restored role to "${previousRole}"`);
                } else {
                  // Delete role record if user had no previous role
                  await supabaseAdmin
                    .from('user_roles')
                    .delete()
                    .eq('user_id', userId);
                  log.info(`[POST /api/users/role] ✅ Database rollback successful - removed role record`);
                }
                
                dbUpdateSuccess = false;
              } catch (rollbackError: any) {
                log.error(`[POST /api/users/role] ❌ CRITICAL: Rollback failed:`, rollbackError);
                // This is a critical error - database is out of sync with WorkOS
              }
              
              return NextResponse.json({
                success: false,
                error: 'Failed to update WorkOS role',
                details: failures.map(f => {
                  if (f.status === 'rejected') return String(f.reason);
                  if (f.status === 'fulfilled') return f.value.error;
                  return 'Unknown error';
                }).join('; '),
                rollback: dbUpdateSuccess ? 'not_attempted' : 'attempted'
              }, { status: 500 });
            } else {
              // Some succeeded, some failed - partial success
              log.warn(`[POST /api/users/role] ⚠️ Partial success: ${successes.length} succeeded, ${failures.length} failed`);
              return NextResponse.json({
                success: true,
                message: `Role updated in database. ${successes.length} WorkOS organization(s) updated successfully, ${failures.length} failed.`,
                warning: 'Some WorkOS role updates failed. User may need to re-login for all changes to take effect.',
                partialFailure: true,
                currentUserRoleChanged: isCurrentUserRoleChange,
                roleChanged: role
              });
            }
          } else {
            log.info(`[POST /api/users/role] ✅ Successfully updated WorkOS roles in all ${memberships.length} organization(s)`);
            return NextResponse.json({ 
              success: true,
              message: 'Role updated in database and WorkOS',
              organizationsUpdated: memberships.length,
              currentUserRoleChanged: isCurrentUserRoleChange,
              roleChanged: role
            });
          }
        }
      } catch (error: any) {
        log.error('[POST /api/users/role] Exception during WorkOS update:', error);
        
        // Rollback database update since WorkOS update failed completely
        log.error(`[POST /api/users/role] Rolling back database change due to WorkOS update exception`);
        try {
          if (previousRole) {
            await supabaseAdmin
              .from('user_roles')
              .upsert({
                user_id: userId,
                role: previousRole,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              });
            log.info(`[POST /api/users/role] ✅ Database rollback successful - restored role to "${previousRole}"`);
          } else {
            await supabaseAdmin
              .from('user_roles')
              .delete()
              .eq('user_id', userId);
            log.info(`[POST /api/users/role] ✅ Database rollback successful - removed role record`);
          }
          dbUpdateSuccess = false;
        } catch (rollbackError: any) {
          log.error(`[POST /api/users/role] ❌ CRITICAL: Rollback failed:`, rollbackError);
        }
        
        return NextResponse.json({
          success: false,
          error: 'Failed to update WorkOS role',
          details: error?.message || String(error),
          rollback: dbUpdateSuccess ? 'failed' : 'successful'
        }, { status: 500 });
      }
    }

    // If not using WorkOS, just return success
    return NextResponse.json({ 
      success: true,
      message: 'Role updated in database',
      currentUserRoleChanged: isCurrentUserRoleChange,
      roleChanged: role
    });
  } catch (error: any) {
    log.error('[POST /api/users/role] Unexpected error:', error);
    
    // Attempt rollback if database was updated
    if (dbUpdateSuccess && userIdForRollback && previousRole !== null) {
      log.warn(`[POST /api/users/role] Attempting rollback due to unexpected error`);
      try {
        await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: userIdForRollback,
            role: previousRole,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });
        log.info(`[POST /api/users/role] ✅ Rollback successful - restored role to "${previousRole}"`);
      } catch (rollbackError: any) {
        log.error(`[POST /api/users/role] ❌ CRITICAL: Rollback failed:`, rollbackError);
      }
    } else if (dbUpdateSuccess && userIdForRollback && previousRole === null) {
      // User had no previous role, try to delete
      try {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userIdForRollback);
        log.info(`[POST /api/users/role] ✅ Rollback successful - removed role record`);
      } catch (rollbackError: any) {
        log.error(`[POST /api/users/role] ❌ CRITICAL: Rollback failed:`, rollbackError);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to set user role', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

