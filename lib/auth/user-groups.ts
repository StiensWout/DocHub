import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from './session';
import { getUserGroupsFromWorkOS, getUserOrganizationMemberships } from '@/lib/workos/organizations';
import { syncTeamsFromUserOrganizations, isUserInAdminOrganization } from '@/lib/workos/team-sync';

export interface UserGroup {
  id: string;
  userId: string;
  groupName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

/**
 * Get user's groups
 * 
 * Uses WorkOS Organization Memberships to retrieve groups.
 * Organizations in WorkOS act as groups - users belong to organizations.
 * Falls back to database if WorkOS groups are not available.
 * 
 * To use WorkOS organization memberships exclusively:
 * 1. Create organizations in WorkOS (via Dashboard or API)
 * 2. Add users to organizations (via Dashboard or API)
 * 3. Set WORKOS_USE_ORGANIZATIONS=true environment variable
 */
export async function getUserGroups(userId: string): Promise<string[]> {
  console.log(`[getUserGroups] Called for userId: ${userId}`);
  
  // Check if we should use WorkOS Organization Memberships
  const useWorkOSGroups = process.env.WORKOS_USE_ORGANIZATIONS === 'true';
  console.log(`[getUserGroups] WORKOS_USE_ORGANIZATIONS=${process.env.WORKOS_USE_ORGANIZATIONS}, useWorkOSGroups=${useWorkOSGroups}`);
  
  if (useWorkOSGroups) {
    try {
      console.log(`[getUserGroups] Starting WorkOS organization sync for user ${userId}`);
      
      // Fetch memberships ONCE and reuse throughout
      const memberships = await getUserOrganizationMemberships(userId, true);
      console.log(`[getUserGroups] Fetched ${memberships.length} organization memberships (cached for reuse)`);
      
      // Sync organizations to teams (creates teams for new organizations)
      // Pass cached memberships to avoid redundant fetch
      const syncedTeamIds = await syncTeamsFromUserOrganizations(userId, memberships);
      console.log(`[getUserGroups] Synced ${syncedTeamIds.length} teams:`, syncedTeamIds);
      
      // Get user's groups from WorkOS (use cached memberships)
      const workosGroups = await getUserGroupsFromWorkOS(userId, memberships);
      console.log(`[getUserGroups] WorkOS groups found:`, workosGroups);
      
      // Check if user is in admin organization (uses cached memberships)
      const isInAdminOrg = await isUserInAdminOrganization(userId, memberships);
      console.log(`[getUserGroups] Is user in admin organization: ${isInAdminOrg}`);
      
      if (isInAdminOrg) {
        console.log(`[getUserGroups] User is admin - fetching all teams`);
        // Admin users see all existing teams/groups plus an "Admin" group
        const { data: allTeams, error: teamsError } = await supabaseAdmin
          .from('teams')
          .select('name')
          .order('name');
        
        if (teamsError) {
          console.error(`[getUserGroups] Error fetching all teams:`, teamsError);
        }
        
        const allTeamNames = (allTeams || []).map(t => t.name);
        console.log(`[getUserGroups] All teams found:`, allTeamNames);
        
        // Add "Admin" group if not already in the list
        if (!allTeamNames.includes('Admin')) {
          allTeamNames.unshift('Admin');
          console.log(`[getUserGroups] Added 'Admin' group to list`);
        }
        
        console.log(`[getUserGroups] Returning admin groups:`, allTeamNames);
        return allTeamNames;
      }
      
      if (workosGroups.length > 0) {
        // WorkOS groups are organizations (e.g., "CDLE")
        // User belongs to 1 organization and 1 team (their role) within that org
        const allTeamNames: string[] = [];
        
        // For each organization the user belongs to, get THEIR specific team (role)
        // Use cached memberships instead of fetching again
        for (const orgName of workosGroups) {
          const membership = memberships.find(m => m.organizationName === orgName);
          
          if (membership) {
            // Extract user's role (their team name)
            let roleName = '';
            if (membership.role) {
              if (typeof membership.role === 'string') {
                roleName = membership.role;
              } else if (typeof membership.role === 'object') {
                roleName = (membership.role as any).slug || (membership.role as any).name || (membership.role as any).id || '';
              }
            }
            
            // Find the team that matches the user's role
            if (roleName && roleName.trim() !== '' && roleName.toLowerCase() !== 'member') {
              const { data: userTeam } = await supabaseAdmin
                .from('teams')
                .select('name')
                .eq('name', roleName.trim())
                .eq('parent_organization_id', membership.organizationId)
                .single();
              
              if (userTeam) {
                allTeamNames.push(userTeam.name);
                console.log(`[getUserGroups] Found user's team "${userTeam.name}" for organization "${orgName}"`);
              } else {
                console.log(`[getUserGroups] Team "${roleName.trim()}" not found in database for organization "${orgName}"`);
              }
            } else {
              console.log(`[getUserGroups] No valid role found for user in organization "${orgName}"`);
            }
          }
        }
        
        console.log(`[getUserGroups] Returning user's team(s) only:`, allTeamNames);
        return allTeamNames;
      }
      // If no WorkOS groups found, fall back to database
      console.log(`[getUserGroups] No WorkOS groups found for user ${userId}, falling back to database`);
    } catch (error: any) {
      console.error('[getUserGroups] Error fetching groups from WorkOS:', error);
      console.error('[getUserGroups] Error stack:', error.stack);
      console.warn('Error fetching groups from WorkOS, falling back to database:', error.message);
      // Fall through to database fallback
    }
  } else {
    console.log(`[getUserGroups] WORKOS_USE_ORGANIZATIONS is not enabled, using database fallback`);
  }
  
  // Fallback to database (legacy support or when Directory Sync not configured)
  try {
    const { data, error } = await supabaseAdmin
      .from('user_groups')
      .select('group_name')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user groups from database:', error);
      return [];
    }

    return (data || []).map(g => g.group_name);
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
}

/**
 * Check if user is admin
 * 
 * When WORKOS_USE_ORGANIZATIONS=true, checks WorkOS organization memberships
 * Otherwise, checks database user_roles table
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;

    const targetUserId = userId || session.user.id;
    const useWorkOSGroups = process.env.WORKOS_USE_ORGANIZATIONS === 'true';

    // If using WorkOS Organizations, check admin organization membership
    if (useWorkOSGroups) {
      try {
        console.log(`[isAdmin] Checking WorkOS admin organization for user: ${targetUserId}`);
        const isInAdminOrg = await isUserInAdminOrganization(targetUserId);
        if (isInAdminOrg) {
          console.log(`[isAdmin] ✅ User ${targetUserId} is admin via WorkOS organization`);
          return true;
        }
        console.log(`[isAdmin] User ${targetUserId} is NOT in admin organization, checking database fallback`);
        // Fall through to database check as backup
      } catch (error: any) {
        console.warn('[isAdmin] Error checking WorkOS admin organization, falling back to database:', error.message);
        // Fall through to database check
      }
    }

    // Database role check (fallback or when not using WorkOS Organizations)
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User doesn't have a role yet, default to 'user'
        return false;
      }
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get user's role
 * 
 * When WORKOS_USE_ORGANIZATIONS=true, checks WorkOS organization memberships
 * Otherwise, checks database user_roles table
 */
export async function getUserRole(userId?: string): Promise<'admin' | 'user'> {
  try {
    const session = await getSession();
    if (!session) return 'user';

    const targetUserId = userId || session.user.id;
    const useWorkOSGroups = process.env.WORKOS_USE_ORGANIZATIONS === 'true';

    // If using WorkOS Organizations, check admin organization membership
    if (useWorkOSGroups) {
      try {
        const isInAdminOrg = await isUserInAdminOrganization(targetUserId);
        if (isInAdminOrg) {
          return 'admin';
        }
        // Fall through to database check as backup
      } catch (error: any) {
        console.warn('Error checking WorkOS admin organization, falling back to database:', error.message);
        // Fall through to database check
      }
    }

    // Database role check (fallback or when not using WorkOS Organizations)
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User doesn't have a role yet, default to 'user'
        return 'user';
      }
      console.error('Error fetching user role:', error);
      return 'user';
    }

    return (data?.role as 'admin' | 'user') || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

/**
 * Get all users (admin only)
 * Now uses local database for faster access
 * Includes all synced users, even if they don't have a role yet
 */
export async function getAllUsers(): Promise<Array<{ userId: string; email: string; role: string; groups: string[] }>> {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get all users from local database
    const { getAllLocalUsers } = await import('@/lib/workos/user-sync');
    const localUsers = await getAllLocalUsers();

    // Get all user roles (create map for quick lookup)
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      // Continue without roles - users will have default 'user' role
    }

    const rolesByUserId: Record<string, string> = {};
    (roles || []).forEach(r => {
      rolesByUserId[r.user_id] = r.role;
    });

    // Get all user groups
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('user_groups')
      .select('user_id, group_name');

    if (groupsError) {
      console.error('Error fetching user groups:', groupsError);
      // Continue without groups - users will have empty groups array
    }

    // Group groups by user_id
    const groupsByUser: Record<string, string[]> = {};
    (groups || []).forEach(g => {
      if (!groupsByUser[g.user_id]) {
        groupsByUser[g.user_id] = [];
      }
      groupsByUser[g.user_id].push(g.group_name);
    });

    // Return all local users, with roles and groups if they exist
    return localUsers.map(localUser => {
      return {
        userId: localUser.workos_user_id,
        email: localUser.email || '',
        role: rolesByUserId[localUser.workos_user_id] || 'user', // Default to 'user' if no role
        groups: groupsByUser[localUser.workos_user_id] || [],
      };
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

