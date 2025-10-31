import { workos } from './server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserOrganizationMemberships } from './organizations';

/**
 * Subgroup utilities
 * 
 * Detects and manages subgroups/teams within parent organizations.
 * Subgroups come from the roles assigned to users in WorkOS organization memberships.
 * 
 * Example:
 * - Organization: "CDLE"
 * - User has role: "Engineering" in CDLE organization
 * - Result: Parent team "CDLE" + subgroup team "Engineering"
 */

/**
 * Get the user's team (subgroup) within an organization based on their role
 * Returns ONLY the user's specific team (role), not all possible teams in the org
 * 
 * Structure: User -> 1 Organization -> 1 Team (their role)
 */
export async function getUserSubgroupsInOrganization(
  userId: string, 
  organizationId: string,
  organizationName: string,
  cachedMemberships?: any[]
): Promise<Array<{ name: string; organizationId: string; isSubgroup: boolean; role?: string }>> {
  try {
    console.log(`[getUserSubgroupsInOrganization] Getting user's team (role) for user ${userId} in org ${organizationName}`);
    
    const subgroups: Array<{ name: string; organizationId: string; isSubgroup: boolean; role?: string }> = [];
    
    // Use cached memberships if provided, otherwise fetch (will use cache)
    const memberships = cachedMemberships || await getUserOrganizationMemberships(userId, true);
    
    // Find the membership for this specific organization
    const membership = memberships.find(m => m.organizationId === organizationId);
    
    if (membership && membership.role) {
      // The role in the organization membership is the user's team
      // Handle role - it might be a string or an object with a slug/name property
      let roleName: string = '';
      
      if (typeof membership.role === 'string') {
        roleName = membership.role;
      } else if (membership.role && typeof membership.role === 'object') {
        // Role is an object - extract the role identifier
        // WorkOS role objects typically have a 'slug' property
        roleName = (membership.role as any).slug || (membership.role as any).name || (membership.role as any).id || '';
        console.log(`[getUserSubgroupsInOrganization] Role is an object, extracted:`, {
          role: membership.role,
          extractedName: roleName
        });
      }
      
      console.log(`[getUserSubgroupsInOrganization] User has role "${roleName}" in organization "${organizationName}"`);
      
      // Only add as subgroup if role is not empty and not a generic role like "member"
      if (roleName && typeof roleName === 'string' && roleName.trim() !== '' && roleName.toLowerCase() !== 'member') {
        subgroups.push({
          name: roleName.trim(), // Role becomes the team name
          organizationId: organizationId, // Same parent org
          isSubgroup: true,
          role: roleName.trim(),
        });
        
        console.log(`[getUserSubgroupsInOrganization] Added user's team "${roleName.trim()}" for org "${organizationName}"`);
      } else {
        console.log(`[getUserSubgroupsInOrganization] Skipping role "${roleName}" (empty or generic)`);
      }
    } else {
      console.log(`[getUserSubgroupsInOrganization] No role found for user in organization "${organizationName}"`);
    }
    
    console.log(`[getUserSubgroupsInOrganization] Found ${subgroups.length} team(s) for user in org ${organizationName}:`, 
      subgroups.map(s => `${s.name} (${s.isSubgroup ? 'team/role' : 'parent org - not used'})`));
    
    return subgroups;
  } catch (error: any) {
    console.error(`[getUserSubgroupsInOrganization] Error getting user's team:`, error);
    return [];
  }
}

/**
 * Ensure a subgroup team exists, linked to parent organization
 */
export async function ensureSubgroupTeam(
  subgroupName: string,
  parentOrganizationId: string,
  parentOrganizationName: string
): Promise<string | null> {
  try {
    console.log(`[ensureSubgroupTeam] Ensuring subgroup team "${subgroupName}" exists for parent "${parentOrganizationName}"`);
    
    // Check if subgroup team already exists
    const { data: existingTeam } = await supabaseAdmin
      .from('teams')
      .select('id, name, parent_organization_id')
      .eq('name', subgroupName)
      .single();
    
    if (existingTeam) {
      // Update parent_organization_id if different
      if (existingTeam.parent_organization_id !== parentOrganizationId) {
        await supabaseAdmin
          .from('teams')
          .update({ parent_organization_id: parentOrganizationId })
          .eq('id', existingTeam.id);
      }
      console.log(`[ensureSubgroupTeam] Subgroup team "${subgroupName}" already exists: ${existingTeam.id}`);
      return existingTeam.id;
    }
    
    // Create new subgroup team
    const { data: newTeam, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name: subgroupName,
        parent_organization_id: parentOrganizationId,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error(`[ensureSubgroupTeam] Error creating subgroup team "${subgroupName}":`, error);
      return null;
    }
    
    console.log(`[ensureSubgroupTeam] ✅ Created subgroup team "${subgroupName}" (ID: ${newTeam.id}) for parent "${parentOrganizationName}"`);
    return newTeam.id;
  } catch (error: any) {
    console.error(`[ensureSubgroupTeam] Exception creating subgroup team:`, error);
    return null;
  }
}

