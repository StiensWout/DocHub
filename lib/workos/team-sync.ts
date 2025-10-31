import { workos } from './server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserOrganizationMemberships, getOrganization } from './organizations';
import { getUserSubgroupsInOrganization, ensureSubgroupTeam } from './subgroups';

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
  console.log(`[ensureTeamForOrganization] Checking team for org: name="${organizationName}", id="${organizationId}"`);
  
  try {
    // First, check if team already exists by name
    console.log(`[ensureTeamForOrganization] Checking if team "${organizationName}" already exists`);
    const { data: existingTeam, error: checkError } = await supabaseAdmin
      .from('teams')
      .select('id, name, workos_organization_id')
      .eq('name', organizationName)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`[ensureTeamForOrganization] Error checking for existing team:`, checkError);
    }

    if (existingTeam) {
      console.log(`[ensureTeamForOrganization] Team "${organizationName}" already exists with ID: ${existingTeam.id}`);
      // Team exists - update workos_organization_id if provided and different
      if (organizationId && existingTeam.workos_organization_id !== organizationId) {
        console.log(`[ensureTeamForOrganization] Updating workos_organization_id from ${existingTeam.workos_organization_id} to ${organizationId}`);
        const { error: updateError } = await supabaseAdmin
          .from('teams')
          .update({ workos_organization_id: organizationId })
          .eq('id', existingTeam.id);
        
        if (updateError) {
          console.error(`[ensureTeamForOrganization] Error updating workos_organization_id:`, updateError);
        } else {
          console.log(`[ensureTeamForOrganization] Successfully updated workos_organization_id`);
        }
      }
      return existingTeam.id;
    }

    // Team doesn't exist - create it
    console.log(`[ensureTeamForOrganization] Team "${organizationName}" does not exist, creating new team`);
    const { data: newTeam, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name: organizationName,
        workos_organization_id: organizationId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[ensureTeamForOrganization] Error creating team "${organizationName}":`, error);
      console.error(`[ensureTeamForOrganization] Error details:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    console.log(`[ensureTeamForOrganization] ✅ Created team "${organizationName}" (ID: ${newTeam.id}) for WorkOS organization ${organizationId || 'N/A'}`);
    return newTeam.id;
  } catch (error: any) {
    console.error(`[ensureTeamForOrganization] Exception creating team "${organizationName}":`, error);
    console.error(`[ensureTeamForOrganization] Exception stack:`, error.stack);
    return null;
  }
}

/**
 * Sync all teams from user's WorkOS organizations
 * Creates teams in DocHub for any organizations the user belongs to
 */
export async function syncTeamsFromUserOrganizations(userId: string): Promise<string[]> {
  console.log(`[syncTeamsFromUserOrganizations] Starting sync for userId: ${userId}`);
  
  try {
    // Get user's organization memberships
    console.log(`[syncTeamsFromUserOrganizations] Fetching organization memberships for user ${userId}`);
    const memberships = await getUserOrganizationMemberships(userId);
    console.log(`[syncTeamsFromUserOrganizations] Found ${memberships?.length || 0} organization memberships:`, 
      memberships?.map(m => `${m.organizationName} (${m.organizationId})`));
    
    if (!memberships || memberships.length === 0) {
      console.log(`[syncTeamsFromUserOrganizations] No organization memberships found for user ${userId}`);
      return [];
    }

    const teamIds: string[] = [];

    // For each organization membership, ensure a team exists
    console.log(`[syncTeamsFromUserOrganizations] Processing ${memberships.length} organization memberships`);
    for (let i = 0; i < memberships.length; i++) {
      const membership = memberships[i];
      console.log(`[syncTeamsFromUserOrganizations] Processing membership ${i + 1}/${memberships.length}: ${membership.organizationName} (${membership.organizationId})`);
      
      try {
        // Get organization details to ensure we have the name
        console.log(`[syncTeamsFromUserOrganizations] Fetching organization details for ${membership.organizationId}`);
        const org = await getOrganization(membership.organizationId);
        if (!org) {
          console.warn(`[syncTeamsFromUserOrganizations] Organization ${membership.organizationId} not found, skipping`);
          continue;
        }
        console.log(`[syncTeamsFromUserOrganizations] Organization details: name="${org.name}", id="${org.id}"`);

        // Create parent organization team if it doesn't exist
        console.log(`[syncTeamsFromUserOrganizations] Ensuring parent team exists for organization "${org.name}"`);
        const parentTeamId = await ensureTeamForOrganization(org.name, membership.organizationId);
        if (parentTeamId) {
          console.log(`[syncTeamsFromUserOrganizations] ✅ Parent team created/found: ${parentTeamId} for "${org.name}"`);
          teamIds.push(parentTeamId);
          
          // Get subgroups/teams within this organization
          console.log(`[syncTeamsFromUserOrganizations] Checking for subgroups within "${org.name}"`);
          const subgroups = await getUserSubgroupsInOrganization(userId, membership.organizationId, org.name);
          
          // Create teams for each subgroup
          for (const subgroup of subgroups) {
            if (subgroup.isSubgroup) {
              console.log(`[syncTeamsFromUserOrganizations] Creating subgroup team: "${subgroup.name}"`);
              const subgroupTeamId = await ensureSubgroupTeam(subgroup.name, membership.organizationId, org.name);
              if (subgroupTeamId) {
                console.log(`[syncTeamsFromUserOrganizations] ✅ Subgroup team created/found: ${subgroupTeamId} for "${subgroup.name}"`);
                teamIds.push(subgroupTeamId);
              }
            }
          }
        } else {
          console.warn(`[syncTeamsFromUserOrganizations] ⚠️ Failed to create/find parent team for "${org.name}"`);
        }
      } catch (error: any) {
        console.error(`[syncTeamsFromUserOrganizations] Error syncing team for organization ${membership.organizationId}:`, error);
        console.error(`[syncTeamsFromUserOrganizations] Error stack:`, error.stack);
      }
    }

    console.log(`[syncTeamsFromUserOrganizations] ✅ Sync complete. Created/found ${teamIds.length} teams:`, teamIds);
    return teamIds;
  } catch (error: any) {
    console.error(`[syncTeamsFromUserOrganizations] Exception syncing teams from user organizations:`, error);
    console.error(`[syncTeamsFromUserOrganizations] Exception stack:`, error.stack);
    return [];
  }
}

/**
 * Check if user is in an "admin" organization
 * Admin organization name can be configured via environment variable
 */
export async function isUserInAdminOrganization(userId: string): Promise<boolean> {
  try {
    const adminOrgName = process.env.WORKOS_ADMIN_ORGANIZATION_NAME || 'admin';
    const memberships = await getUserOrganizationMemberships(userId);
    
    return memberships.some(m => 
      m.organizationName.toLowerCase() === adminOrgName.toLowerCase()
    );
  } catch (error: any) {
    console.error('Error checking admin organization membership:', error);
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
    console.error('Error getting user accessible teams:', error);
    return [];
  }
}

