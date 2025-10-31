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
 * Get subgroups for a user within an organization based on their role
 * Returns both the parent organization and any subgroups (roles)
 */
export async function getUserSubgroupsInOrganization(
  userId: string, 
  organizationId: string,
  organizationName: string
): Promise<Array<{ name: string; organizationId: string; isSubgroup: boolean; role?: string }>> {
  try {
    console.log(`[getUserSubgroupsInOrganization] Getting subgroups for user ${userId} in org ${organizationName}`);
    
    const subgroups: Array<{ name: string; organizationId: string; isSubgroup: boolean; role?: string }> = [];
    
    // First, add the parent organization
    subgroups.push({
      name: organizationName,
      organizationId: organizationId,
      isSubgroup: false,
    });
    
    // Get user's organization memberships to find their role in this organization
    const memberships = await getUserOrganizationMemberships(userId);
    
    // Find the membership for this specific organization
    const membership = memberships.find(m => m.organizationId === organizationId);
    
    if (membership && membership.role) {
      // The role in the organization membership is the subgroup/team
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
      // You can customize this logic based on your role naming conventions
      if (roleName && typeof roleName === 'string' && roleName.trim() !== '' && roleName.toLowerCase() !== 'member') {
        subgroups.push({
          name: roleName.trim(), // Role becomes the subgroup team name
          organizationId: organizationId, // Same parent org
          isSubgroup: true,
          role: roleName.trim(),
        });
        
        console.log(`[getUserSubgroupsInOrganization] Added subgroup "${roleName.trim()}" for org "${organizationName}"`);
      } else {
        console.log(`[getUserSubgroupsInOrganization] Skipping role "${roleName}" (empty or generic)`);
      }
    } else {
      console.log(`[getUserSubgroupsInOrganization] No role found for user in organization "${organizationName}"`);
    }
    
    console.log(`[getUserSubgroupsInOrganization] Found ${subgroups.length} teams for org ${organizationName}:`, 
      subgroups.map(s => `${s.name} (${s.isSubgroup ? 'subgroup/role' : 'parent'})`));
    
    return subgroups;
  } catch (error: any) {
    console.error(`[getUserSubgroupsInOrganization] Error getting subgroups:`, error);
    // Return at least the parent org
    return [{
      name: organizationName,
      organizationId: organizationId,
      isSubgroup: false,
    }];
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

