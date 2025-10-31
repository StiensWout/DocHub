import { workos } from './server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserOrganizationMemberships, getOrganization } from './organizations';
import { getUserSubgroupsInOrganization, ensureSubgroupTeam } from './subgroups';
import { log } from '@/lib/logger';

/**
 * Team sync utilities
 * 
 * This module syncs WorkOS Organizations to DocHub Teams
 * When a user joins a new organization in WorkOS, the corresponding team
 * is automatically created in DocHub (if it doesn't exist)
 */

/**
 * Ensure a team exists for a WorkOS organization
 * Creates the team if it doesn't exist, returns existing team if it does
 */
export async function ensureTeamForOrganization(organizationName: string, organizationId?: string): Promise<string | null> {
  log.debug(`[ensureTeamForOrganization] Checking team for org: name="${organizationName}", id="${organizationId}"`);
  
  try {
    // First, check if team already exists by name
    log.debug(`[ensureTeamForOrganization] Checking if team "${organizationName}" already exists`);
    const { data: existingTeam, error: checkError } = await supabaseAdmin
      .from('teams')
      .select('id, name, workos_organization_id')
      .eq('name', organizationName)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      log.error(`[ensureTeamForOrganization] Error checking for existing team:`, checkError);
    }

    if (existingTeam) {
      log.debug(`[ensureTeamForOrganization] Team "${organizationName}" already exists with ID: ${existingTeam.id}`);
      // Team exists - update workos_organization_id if provided and different
      if (organizationId && existingTeam.workos_organization_id !== organizationId) {
        log.debug(`[ensureTeamForOrganization] Updating workos_organization_id from ${existingTeam.workos_organization_id} to ${organizationId}`);
        const { error: updateError } = await supabaseAdmin
          .from('teams')
          .update({ workos_organization_id: organizationId })
          .eq('id', existingTeam.id);
        
        if (updateError) {
          log.error(`[ensureTeamForOrganization] Error updating workos_organization_id:`, updateError);
        } else {
          log.debug(`[ensureTeamForOrganization] Successfully updated workos_organization_id`);
        }
      }
      return existingTeam.id;
    }

    // Team doesn't exist - create it
    log.debug(`[ensureTeamForOrganization] Team "${organizationName}" does not exist, creating new team`);
    const { data: newTeam, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name: organizationName,
        workos_organization_id: organizationId || null,
      })
      .select('id')
      .single();

    if (error) {
      log.error(`[ensureTeamForOrganization] Error creating team "${organizationName}":`, error);
      log.error(`[ensureTeamForOrganization] Error details:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    log.info(`[ensureTeamForOrganization] ✅ Created team "${organizationName}" (ID: ${newTeam.id}) for WorkOS organization ${organizationId || 'N/A'}`);
    return newTeam.id;
  } catch (error: any) {
    log.error(`[ensureTeamForOrganization] Exception creating team "${organizationName}":`, error);
    log.error(`[ensureTeamForOrganization] Exception stack:`, error.stack);
    return null;
  }
}

/**
 * Sync all teams from user's WorkOS organizations
 * Creates teams in DocHub for any organizations the user belongs to
 * 
 * @param userId - The user ID
 * @param cachedMemberships - Optional cached memberships to avoid redundant API calls
 */
export async function syncTeamsFromUserOrganizations(userId: string, cachedMemberships?: any[]): Promise<string[]> {
  log.debug(`[syncTeamsFromUserOrganizations] Starting sync for userId: ${userId}`);
  
  try {
    // Get user's organization memberships (use cache or cached parameter)
    const memberships = cachedMemberships || await getUserOrganizationMemberships(userId, true);
    log.debug(`[syncTeamsFromUserOrganizations] Found ${memberships?.length || 0} organization memberships:`, 
      memberships?.map(m => `${m.organizationName} (${m.organizationId})`));
    
    if (!memberships || memberships.length === 0) {
      log.debug(`[syncTeamsFromUserOrganizations] No organization memberships found for user ${userId}`);
      return [];
    }

    const teamIds: string[] = [];

    // For each organization membership, ensure a team exists
    log.debug(`[syncTeamsFromUserOrganizations] Processing ${memberships.length} organization memberships`);
    for (let i = 0; i < memberships.length; i++) {
      const membership = memberships[i];
      log.debug(`[syncTeamsFromUserOrganizations] Processing membership ${i + 1}/${memberships.length}: ${membership.organizationName} (${membership.organizationId})`);
      
      try {
        // Get organization details to ensure we have the name
        const org = await getOrganization(membership.organizationId);
        if (!org) {
          log.warn(`[syncTeamsFromUserOrganizations] Organization ${membership.organizationId} not found, skipping`);
          continue;
        }

        // NOTE: We do NOT create the parent organization as a team
        // The organization (e.g., "CDLE") is just the org, not a team
        // Only subgroups (roles within the org) become teams
        
        // Get subgroups/teams within this organization (based on user's role)
        // Pass cached memberships to avoid another fetch
        const subgroups = await getUserSubgroupsInOrganization(userId, membership.organizationId, org.name, memberships);
        
        // Create teams ONLY for subgroups (not the parent org)
        for (const subgroup of subgroups) {
          if (subgroup.isSubgroup) {
            log.debug(`[syncTeamsFromUserOrganizations] Creating subgroup team: "${subgroup.name}"`);
            const subgroupTeamId = await ensureSubgroupTeam(subgroup.name, membership.organizationId, org.name);
            if (subgroupTeamId) {
              log.debug(`[syncTeamsFromUserOrganizations] ✅ Subgroup team created/found: ${subgroupTeamId} for "${subgroup.name}"`);
              teamIds.push(subgroupTeamId);
            }
          }
        }
        
        log.debug(`[syncTeamsFromUserOrganizations] Organization "${org.name}" serves as parent - teams are subgroups only`);
      } catch (error: any) {
        log.error(`[syncTeamsFromUserOrganizations] Error syncing team for organization ${membership.organizationId}:`, error);
        log.error(`[syncTeamsFromUserOrganizations] Error stack:`, error.stack);
      }
    }

    log.info(`[syncTeamsFromUserOrganizations] ✅ Sync complete. Created/found ${teamIds.length} teams:`, teamIds);
    return teamIds;
  } catch (error: any) {
    log.error(`[syncTeamsFromUserOrganizations] Exception syncing teams from user organizations:`, error);
    log.error(`[syncTeamsFromUserOrganizations] Exception stack:`, error.stack);
    return [];
  }
}

/**
 * Check if user is in an "admin" organization
 * Admin organization name can be configured via environment variable
 */
export async function isUserInAdminOrganization(userId: string, cachedMemberships?: any[]): Promise<boolean> {
  try {
    const adminOrgName = process.env.WORKOS_ADMIN_ORGANIZATION_NAME || 'admin';
    log.debug(`[isUserInAdminOrganization] Checking admin status for user ${userId}`);
    log.debug(`[isUserInAdminOrganization] Looking for organization name: "${adminOrgName}" (case-insensitive)`);
    
    // Use cached memberships if provided, otherwise fetch (will use cache)
    const memberships = cachedMemberships || await getUserOrganizationMemberships(userId, true);
    log.debug(`[isUserInAdminOrganization] Found ${memberships.length} organization memberships:`, 
      memberships.map(m => `${m.organizationName} (role: ${typeof m.role === 'string' ? m.role : JSON.stringify(m.role)})`));
    
    // Check 1: Is user in an organization named "admin"?
    const isInAdminOrg = memberships.some(m => 
      m.organizationName.toLowerCase() === adminOrgName.toLowerCase()
    );
    
    if (isInAdminOrg) {
      const matchingOrg = memberships.find(m => 
        m.organizationName.toLowerCase() === adminOrgName.toLowerCase()
      );
      log.debug(`[isUserInAdminOrganization] ✅ User IS in admin organization: "${matchingOrg?.organizationName}"`);
      return true;
    }

    // Check 2: Does user have a role/team called "admin" in any organization?
    // This is a fallback - if user has role "admin" anywhere, treat them as admin
    for (const membership of memberships) {
      let roleName = '';
      if (membership.role) {
        if (typeof membership.role === 'string') {
          roleName = membership.role;
        } else if (typeof membership.role === 'object') {
          roleName = (membership.role as any).slug || (membership.role as any).name || (membership.role as any).id || '';
        }
      }
      
      if (roleName && roleName.toLowerCase() === 'admin') {
        log.debug(`[isUserInAdminOrganization] ✅ User has admin role/team in organization "${membership.organizationName}"`);
        return true;
      }
    }
    
    log.debug(`[isUserInAdminOrganization] ❌ User is NOT in admin organization or has admin role. Expected org: "${adminOrgName}"`);
    log.debug(`[isUserInAdminOrganization] User's organizations and roles:`, 
      memberships.map(m => `${m.organizationName} (role: ${typeof m.role === 'string' ? m.role : JSON.stringify(m.role)})`));
    
    return false;
  } catch (error: any) {
    log.error('[isUserInAdminOrganization] Error checking admin organization membership:', error);
    return false;
  }
}

/**
 * Get all teams that should be visible to the user
 * For admin users in admin organization: returns all teams + admin team
 * For regular users: returns only teams from their organizations
 */
export async function getUserAccessibleTeams(userId: string): Promise<Array<{ id: string; name: string }>> {
  try {
    // Check if user is in admin organization
    const isInAdminOrg = await isUserInAdminOrganization(userId);
    
    if (isInAdminOrg) {
      // Admin users see all teams + an Admin team
      const { data: allTeams } = await supabaseAdmin
        .from('teams')
        .select('id, name')
        .order('name');

      const teams = (allTeams || []).map(t => ({ id: t.id, name: t.name }));
      
      // Add Admin team if it doesn't exist
      const hasAdminTeam = teams.some(t => t.name.toLowerCase() === 'admin');
      if (!hasAdminTeam) {
        // Create Admin team for admin users
        const { data: adminTeam } = await supabaseAdmin
          .from('teams')
          .insert({ name: 'Admin' })
          .select('id, name')
          .single();
        
        if (adminTeam) {
          teams.unshift({ id: adminTeam.id, name: adminTeam.name }); // Add at the beginning
        }
      } else {
        // Move Admin team to the beginning
        const adminTeam = teams.find(t => t.name.toLowerCase() === 'admin');
        if (adminTeam) {
          const index = teams.indexOf(adminTeam);
          teams.splice(index, 1);
          teams.unshift(adminTeam);
        }
      }

      return teams;
    } else {
      // Regular users see only teams from their organizations
      // Sync organizations to teams first
      await syncTeamsFromUserOrganizations(userId);
      
      const memberships = await getUserOrganizationMemberships(userId);
      const teamNames = memberships.map(m => m.organizationName);

      if (teamNames.length === 0) {
        return [];
      }

      const { data: teams } = await supabaseAdmin
        .from('teams')
        .select('id, name')
        .in('name', teamNames)
        .order('name');

      return (teams || []).map(t => ({ id: t.id, name: t.name }));
    }
  } catch (error: any) {
    log.error('Error getting user accessible teams:', error);
    return [];
  }
}

