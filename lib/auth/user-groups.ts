import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from './session';
import { getUserGroupsFromWorkOS } from '@/lib/workos/organizations';
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
      
      // Sync organizations to teams (creates teams for new organizations)
      const syncedTeamIds = await syncTeamsFromUserOrganizations(userId);
      console.log(`[getUserGroups] Synced ${syncedTeamIds.length} teams:`, syncedTeamIds);
      
      // Get user's groups from WorkOS
      const workosGroups = await getUserGroupsFromWorkOS(userId);
      console.log(`[getUserGroups] WorkOS groups found:`, workosGroups);
      
      // Check if user is in admin organization
      const isInAdminOrg = await isUserInAdminOrganization(userId);
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
        // Also include all subgroup teams that belong to the same parent organization
        // This ensures users see both parent org and subgroups
        const allTeamNames = new Set<string>(workosGroups);
        
        // For each parent organization group, find all subgroup teams
        for (const parentGroupName of workosGroups) {
          // Find the parent organization ID for this group
          const { data: parentTeam } = await supabaseAdmin
            .from('teams')
            .select('workos_organization_id')
            .eq('name', parentGroupName)
            .single();
          
          if (parentTeam?.workos_organization_id) {
            // Find all subgroups (teams with this parent_organization_id)
            const { data: subgroups } = await supabaseAdmin
              .from('teams')
              .select('name')
              .eq('parent_organization_id', parentTeam.workos_organization_id);
            
            if (subgroups && subgroups.length > 0) {
              subgroups.forEach(subgroup => allTeamNames.add(subgroup.name));
              console.log(`[getUserGroups] Found ${subgroups.length} subgroups for "${parentGroupName}"`);
            }
          }
        }
        
        const allGroups = Array.from(allTeamNames);
        console.log(`[getUserGroups] Returning WorkOS groups + subgroups:`, allGroups);
        return allGroups;
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
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;

    const targetUserId = userId || session.user.id;

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
 */
export async function getUserRole(userId?: string): Promise<'admin' | 'user'> {
  try {
    const session = await getSession();
    if (!session) return 'user';

    const targetUserId = userId || session.user.id;

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
 */
export async function getAllUsers(): Promise<Array<{ userId: string; email: string; role: string; groups: string[] }>> {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get all user roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return [];
    }

    // Get all user groups
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('user_groups')
      .select('user_id, group_name');

    if (groupsError) {
      console.error('Error fetching user groups:', groupsError);
      return [];
    }

    // Group groups by user_id
    const groupsByUser: Record<string, string[]> = {};
    (groups || []).forEach(g => {
      if (!groupsByUser[g.user_id]) {
        groupsByUser[g.user_id] = [];
      }
      groupsByUser[g.user_id].push(g.group_name);
    });

    // Combine roles and groups
    return (roles || []).map(role => ({
      userId: role.user_id,
      email: '', // Will be populated from WorkOS if needed
      role: role.role,
      groups: groupsByUser[role.user_id] || [],
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

