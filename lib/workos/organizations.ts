import { workos } from './server';
import { getCachedMemberships, setCachedMemberships } from './membership-cache';

/**
 * WorkOS Organization Memberships utilities
 * 
 * This module provides functions to interact with WorkOS Organizations
 * to retrieve user groups via organization memberships.
 * 
 * WorkOS Organizations are simpler than Directory Sync - they're managed
 * directly in WorkOS and can be used as groups for access control.
 * 
 * Prerequisites:
 * - Organizations must be created in WorkOS (via Dashboard or API)
 * - Users must be added to organizations (via Dashboard or API)
 */

export interface OrganizationInfo {
  id: string;
  name: string;
  domains?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all organizations
 */
export async function getOrganizations(): Promise<OrganizationInfo[]> {
  try {
    const { data } = await workos.organizations.listOrganizations();

    return (data || []).map(org => ({
      id: org.id,
      name: org.name,
      domains: org.domains || [],
      createdAt: org.createdAt?.toISOString() || '',
      updatedAt: org.updatedAt?.toISOString() || '',
    }));
  } catch (error: any) {
    console.error('Error getting organizations:', error);
    return [];
  }
}

/**
 * Get organization by ID
 */
export async function getOrganization(organizationId: string): Promise<OrganizationInfo | null> {
  try {
    const organization = await workos.organizations.getOrganization(organizationId);
    
    // Handle createdAt - it might be a Date object, string, or undefined
    let createdAtStr = '';
    if (organization.createdAt) {
      if (organization.createdAt instanceof Date) {
        createdAtStr = organization.createdAt.toISOString();
      } else if (typeof organization.createdAt === 'string') {
        createdAtStr = organization.createdAt;
      } else {
        try {
          createdAtStr = new Date(organization.createdAt).toISOString();
        } catch {
          createdAtStr = '';
        }
      }
    }
    
    // Handle updatedAt - it might be a Date object, string, or undefined
    let updatedAtStr = '';
    if (organization.updatedAt) {
      if (organization.updatedAt instanceof Date) {
        updatedAtStr = organization.updatedAt.toISOString();
      } else if (typeof organization.updatedAt === 'string') {
        updatedAtStr = organization.updatedAt;
      } else {
        try {
          updatedAtStr = new Date(organization.updatedAt).toISOString();
        } catch {
          updatedAtStr = '';
        }
      }
    }
    
    return {
      id: organization.id,
      name: organization.name,
      domains: organization.domains || [],
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };
  } catch (error: any) {
    console.error('Error getting organization:', error);
    return null;
  }
}

/**
 * Get all groups for a user from WorkOS Organization Memberships
 * Uses WorkOS Organizations as groups - returns organization names/IDs the user belongs to
 * 
 * This requires:
 * 1. Organizations to be created in WorkOS (via Dashboard or API)
 * 2. Users to be added to organizations (via Dashboard or API)
 */
export async function getUserGroupsFromWorkOS(userId: string): Promise<string[]> {
  try {
    // Get user's organization memberships
    const { data: memberships } = await workos.userManagement.listOrganizationMemberships({
      userId: userId,
    });

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Option 1: Return organization IDs (can be used as group identifiers)
    // return memberships.map(m => m.organizationId).filter(Boolean);

    // Option 2: Return organization names (more readable, used as group names)
    // Fetch organization details to get names
    const organizationNames = await Promise.all(
      memberships.map(async (membership) => {
        try {
          const org = await workos.organizations.getOrganization(membership.organizationId);
          return org.name;
        } catch (error: any) {
          console.warn(`Could not fetch organization ${membership.organizationId}:`, error.message);
          // Fallback to organization ID if name can't be retrieved
          return membership.organizationId;
        }
      })
    );

    return organizationNames.filter(Boolean);
  } catch (error: any) {
    if (error.code === 'not_found' || error.message?.includes('user')) {
      console.log(`User ${userId} has no WorkOS organization memberships`);
      return [];
    }
    console.error('Error getting user groups from WorkOS:', error);
    return [];
  }
}

/**
 * Get organization memberships for a user
 * Returns both organization IDs and details
 */
export async function getUserOrganizationMemberships(userId: string, useCache: boolean = true) {
  // Check cache first
  if (useCache) {
    const cached = getCachedMemberships(userId);
    if (cached !== null) {
      console.log(`[getUserOrganizationMemberships] ✅ Using cached memberships for userId: ${userId} (${cached.length} memberships)`);
      return cached;
    }
  }
  
  console.log(`[getUserOrganizationMemberships] 🔄 Fetching memberships for userId: ${userId}`);
  
  try {
    const { data: memberships, error: listError } = await workos.userManagement.listOrganizationMemberships({
      userId: userId,
    });

    if (listError) {
      console.error(`[getUserOrganizationMemberships] Error listing memberships:`, listError);
      return [];
    }

    if (!memberships || memberships.length === 0) {
      console.log(`[getUserOrganizationMemberships] No organization memberships found for user ${userId}`);
      // Cache empty result to avoid repeated checks
      if (useCache) {
        setCachedMemberships(userId, []);
      }
      return [];
    }

    console.log(`[getUserOrganizationMemberships] Found ${memberships.length} raw memberships for user ${userId}`);

    // Enrich with organization details
    console.log(`[getUserOrganizationMemberships] Enriching memberships with organization details...`);
    const enrichedMemberships = await Promise.all(
      memberships.map(async (membership, index) => {
        try {
          const org = await workos.organizations.getOrganization(membership.organizationId);
          
          // Handle createdAt - it might be a Date object, string, or undefined
          let createdAtStr = '';
          if (membership.createdAt) {
            if (membership.createdAt instanceof Date) {
              createdAtStr = membership.createdAt.toISOString();
            } else if (typeof membership.createdAt === 'string') {
              createdAtStr = membership.createdAt;
            } else {
              // Try to convert if it's a timestamp or other format
              createdAtStr = new Date(membership.createdAt).toISOString();
            }
          }
          
          // Handle role - it might be a string or an object
          let roleValue: string | object = '';
          if (membership.role) {
            if (typeof membership.role === 'string') {
              roleValue = membership.role;
            } else {
              roleValue = membership.role;
            }
          }
          
          return {
            organizationId: membership.organizationId,
            organizationName: org.name,
            role: roleValue, // Role can be used as subgroup identifier
            createdAt: createdAtStr,
          };
        } catch (error: any) {
          console.warn(`[getUserOrganizationMemberships] Could not fetch org ${membership.organizationId}, using ID as name:`, error.message);
          
          // Handle createdAt - it might be a Date object, string, or undefined
          let createdAtStr = '';
          if (membership.createdAt) {
            if (membership.createdAt instanceof Date) {
              createdAtStr = membership.createdAt.toISOString();
            } else if (typeof membership.createdAt === 'string') {
              createdAtStr = membership.createdAt;
            } else {
              // Try to convert if it's a timestamp or other format
              try {
                createdAtStr = new Date(membership.createdAt).toISOString();
              } catch {
                createdAtStr = '';
              }
            }
          }
          
          // Handle role
          let roleValue: string | object = '';
          if (membership.role) {
            if (typeof membership.role === 'string') {
              roleValue = membership.role;
            } else {
              roleValue = membership.role;
            }
          }
          
          return {
            organizationId: membership.organizationId,
            organizationName: membership.organizationId, // Fallback to ID
            role: roleValue,
            createdAt: createdAtStr,
          };
        }
      })
    );

    // Cache the result
    if (useCache) {
      setCachedMemberships(userId, enrichedMemberships);
    }

    console.log(`[getUserOrganizationMemberships] ✅ Returning ${enrichedMemberships.length} enriched memberships (cached):`, 
      enrichedMemberships.map(m => `${m.organizationName} (${m.organizationId})`));
    return enrichedMemberships;
  } catch (error: any) {
    console.error(`[getUserOrganizationMemberships] Exception getting organization memberships:`, error);
    console.error(`[getUserOrganizationMemberships] Exception stack:`, error.stack);
    return [];
  }
}

/**
 * Add user to an organization
 * Requires admin privileges or appropriate permissions
 */
export async function addUserToOrganization(userId: string, organizationId: string) {
  try {
    await workos.userManagement.createOrganizationMembership({
      userId: userId,
      organizationId: organizationId,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error adding user to organization:', error);
    throw error;
  }
}

/**
 * Remove user from an organization
 * Requires admin privileges or appropriate permissions
 */
export async function removeUserFromOrganization(userId: string, organizationId: string) {
  try {
    // Get the membership ID first
    const { data: memberships } = await workos.userManagement.listOrganizationMemberships({
      userId: userId,
    });

    const membership = memberships?.find(m => m.organizationId === organizationId);
    if (!membership || !membership.id) {
      throw new Error('User is not a member of this organization');
    }

    await workos.userManagement.deleteOrganizationMembership(membership.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error removing user from organization:', error);
    throw error;
  }
}

