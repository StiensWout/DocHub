import { workos } from './server';
import { getCachedMemberships, setCachedMemberships } from './membership-cache';
import { log } from '@/lib/logger';

/**
 * WorkOS Error Types
 */
interface WorkOSError extends Error {
  code?: string;
  statusCode?: number;
  message: string;
}

/**
 * Enhanced error logging with context
 */
function logWorkOSError(
  operation: string,
  error: WorkOSError | any,
  context?: { userId?: string; organizationId?: string; [key: string]: any }
): void {
  const contextStr = context 
    ? Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ')
    : '';
  
  const errorDetails = {
    operation,
    errorCode: error?.code,
    statusCode: error?.statusCode,
    message: error?.message || String(error),
    context: contextStr || 'none',
    stack: error?.stack,
  };

  log.error(`[WorkOS Error] ${operation}${contextStr ? ` (${contextStr})` : ''}:`, errorDetails);
}

/**
 * Extract meaningful error message from WorkOS error
 */
function getWorkOSErrorMessage(error: WorkOSError | any, defaultMessage: string): string {
  if (!error) return defaultMessage;
  
  // Handle WorkOS-specific error codes
  if (error.code) {
    switch (error.code) {
      case 'not_found':
        return 'Resource not found';
      case 'unauthorized':
        return 'Unauthorized access';
      case 'forbidden':
        return 'Access forbidden';
      case 'rate_limit_exceeded':
        return 'Rate limit exceeded. Please try again later';
      case 'invalid_request':
        return error.message || 'Invalid request';
      default:
        return error.message || defaultMessage;
    }
  }
  
  // Handle HTTP status codes
  if (error.statusCode) {
    switch (error.statusCode) {
      case 404:
        return 'Resource not found';
      case 401:
        return 'Unauthorized access';
      case 403:
        return 'Access forbidden';
      case 429:
        return 'Rate limit exceeded. Please try again later';
      case 500:
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again later';
      default:
        return error.message || defaultMessage;
    }
  }
  
  return error.message || defaultMessage;
}

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

export interface EnrichedMembership {
  organizationId: string;
  organizationName: string;
  role?: string | object;
  createdAt?: string;
}

/**
 * Get all organizations
 */
export async function getOrganizations(): Promise<OrganizationInfo[]> {
  try {
    const { data } = await workos.organizations.listOrganizations();

    return (data || []).map(org => {
      // Map OrganizationDomain[] to string[] by extracting domain strings
      const domains: string[] = org.domains 
        ? org.domains.map(d => typeof d === 'string' ? d : (d as any).domain || '').filter(Boolean) as string[]
        : [];
      
      // Handle createdAt - check if it's a Date or string
      let createdAtStr = '';
      if (org.createdAt) {
        // Check type first before instanceof (TypeScript requires this)
        if (typeof org.createdAt === 'string') {
          createdAtStr = org.createdAt;
        } else if (org.createdAt instanceof Date) {
          createdAtStr = org.createdAt.toISOString();
        } else {
          try {
            createdAtStr = new Date(org.createdAt as any).toISOString();
          } catch {
            createdAtStr = '';
          }
        }
      }
      
      // Handle updatedAt - check if it's a Date or string
      let updatedAtStr = '';
      if (org.updatedAt) {
        // Check type first before instanceof (TypeScript requires this)
        if (typeof org.updatedAt === 'string') {
          updatedAtStr = org.updatedAt;
        } else if (org.updatedAt instanceof Date) {
          updatedAtStr = org.updatedAt.toISOString();
        } else {
          try {
            updatedAtStr = new Date(org.updatedAt as any).toISOString();
          } catch {
            updatedAtStr = '';
          }
        }
      }
      
      return {
        id: org.id,
        name: org.name,
        domains: domains.filter(Boolean),
        createdAt: createdAtStr,
        updatedAt: updatedAtStr,
      };
    });
  } catch (error: any) {
    logWorkOSError('getOrganizations', error);
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
      // Check type first before instanceof (TypeScript requires this)
      if (typeof organization.createdAt === 'string') {
        createdAtStr = organization.createdAt;
      } else if (organization.createdAt instanceof Date) {
        createdAtStr = organization.createdAt.toISOString();
      } else {
        try {
          createdAtStr = new Date(organization.createdAt as any).toISOString();
        } catch {
          createdAtStr = '';
        }
      }
    }
    
    // Handle updatedAt - it might be a Date object, string, or undefined
    let updatedAtStr = '';
    if (organization.updatedAt) {
      // Check type first before instanceof (TypeScript requires this)
      if (typeof organization.updatedAt === 'string') {
        updatedAtStr = organization.updatedAt;
      } else if (organization.updatedAt instanceof Date) {
        updatedAtStr = organization.updatedAt.toISOString();
      } else {
        try {
          updatedAtStr = new Date(organization.updatedAt as any).toISOString();
        } catch {
          updatedAtStr = '';
        }
      }
    }
    
    // Map OrganizationDomain[] to string[] by extracting domain strings
    const domains: string[] = organization.domains 
      ? organization.domains.map(d => typeof d === 'string' ? d : (d as any).domain || '').filter(Boolean) as string[]
      : [];
    
    return {
      id: organization.id,
      name: organization.name,
      domains: domains,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };
  } catch (error: any) {
    logWorkOSError('getOrganization', error, { organizationId });
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
 * 
 * @param userId - The user ID to get groups for
 * @param memberships - Optional pre-fetched memberships (enriched with organization names)
 *                      If provided, avoids redundant API calls for caching optimization
 */
export async function getUserGroupsFromWorkOS(
  userId: string,
  memberships?: EnrichedMembership[]
): Promise<string[]> {
  try {
    // If memberships are provided, use them directly (caching optimization)
    if (memberships && memberships.length > 0) {
      log.debug(`[getUserGroupsFromWorkOS] Using provided memberships (${memberships.length} memberships)`);
      return memberships.map(m => m.organizationName).filter(Boolean);
    }

    // Otherwise, fetch memberships (legacy behavior or when memberships not provided)
    log.debug(`[getUserGroupsFromWorkOS] Fetching memberships for userId: ${userId}`);
    // WorkOS SDK returns { data: [] } structure for list operations
    const response = await workos.userManagement.listOrganizationMemberships({
      userId: userId,
    });
    
    // Handle both { data: [] } and direct array responses
    const membershipsData = Array.isArray(response) ? response : (response?.data || []);

    if (!membershipsData || membershipsData.length === 0) {
      return [];
    }

    // Option 1: Return organization IDs (can be used as group identifiers)
    // return memberships.map(m => m.organizationId).filter(Boolean);

    // Option 2: Return organization names (more readable, used as group names)
    // Fetch organization details to get names
    const organizationNames = await Promise.all(
      membershipsData.map(async (membership) => {
        try {
          const org = await workos.organizations.getOrganization(membership.organizationId);
          return org.name;
        } catch (error: any) {
          logWorkOSError('getUserGroupsFromWorkOS - fetchOrganization', error, { 
            organizationId: membership.organizationId,
            userId 
          });
          // Fallback to organization ID if name can't be retrieved
          return membership.organizationId;
        }
      })
    );

    return organizationNames.filter(Boolean);
  } catch (error: any) {
    if (error.code === 'not_found' || error.message?.includes('user')) {
      log.debug(`[getUserGroupsFromWorkOS] User ${userId} has no WorkOS organization memberships`);
      return [];
    }
    logWorkOSError('getUserGroupsFromWorkOS', error, { userId });
    return [];
  }
}

/**
 * Get organization memberships for a user
 * Returns both organization IDs and details
 */
export async function getUserOrganizationMemberships(userId: string, useCache: boolean = true): Promise<EnrichedMembership[]> {
  // Check cache first
  if (useCache) {
    const cached = getCachedMemberships(userId);
    if (cached !== null) {
      log.debug(`[getUserOrganizationMemberships] ✅ Using cached memberships for userId: ${userId} (${cached.length} memberships)`);
      return cached;
    }
  }
  
  log.debug(`[getUserOrganizationMemberships] 🔄 Fetching memberships for userId: ${userId}`);
  
  try {
    // WorkOS SDK returns { data: [] } structure for list operations
    const response = await workos.userManagement.listOrganizationMemberships({
      userId: userId,
    });
    
    // Handle both { data: [] } and direct array responses
    const memberships = Array.isArray(response) ? response : (response?.data || []);

    if (!memberships || memberships.length === 0) {
      log.debug(`[getUserOrganizationMemberships] No organization memberships found for user ${userId}`);
      // Cache empty result to avoid repeated checks
      if (useCache) {
        setCachedMemberships(userId, []);
      }
      return [];
    }

    log.debug(`[getUserOrganizationMemberships] Found ${memberships.length} raw memberships for user ${userId}`);

    // Enrich with organization details
    log.debug(`[getUserOrganizationMemberships] Enriching memberships with organization details...`);
    const enrichedMemberships = await Promise.all(
      memberships.map(async (membership, index) => {
        try {
          const org = await workos.organizations.getOrganization(membership.organizationId);
          
          // Handle createdAt - it might be a Date object, string, or undefined
          let createdAtStr = '';
          if (membership.createdAt) {
            // Check type first before instanceof (TypeScript requires this)
            if (typeof membership.createdAt === 'string') {
              createdAtStr = membership.createdAt;
            } else if (membership.createdAt instanceof Date) {
              createdAtStr = membership.createdAt.toISOString();
            } else {
              // Try to convert if it's a timestamp or other format
              try {
                createdAtStr = new Date(membership.createdAt as any).toISOString();
              } catch {
                createdAtStr = '';
              }
            }
          }
          
          // Handle role - it might be a string or an object
          let roleValue: string | object = '';
          if (membership.role) {
            if (typeof membership.role === 'string') {
              roleValue = membership.role;
            } else if (typeof membership.role === 'object') {
              // Extract slug, name, or id from role object (consistent with other code)
              roleValue = (membership.role as any).slug || (membership.role as any).name || (membership.role as any).id || '';
            }
          }
          
          return {
            organizationId: membership.organizationId,
            organizationName: org.name,
            role: roleValue, // Role can be used as subgroup identifier
            createdAt: createdAtStr,
          };
        } catch (error: any) {
          logWorkOSError('getUserOrganizationMemberships - enrichMembership', error, {
            userId,
            organizationId: membership.organizationId,
            membershipIndex: index,
          });
          
          // Handle createdAt - it might be a Date object, string, or undefined
          let createdAtStr = '';
          if (membership.createdAt) {
            // Check type first before instanceof (TypeScript requires this)
            if (typeof membership.createdAt === 'string') {
              createdAtStr = membership.createdAt;
            } else if (membership.createdAt instanceof Date) {
              createdAtStr = membership.createdAt.toISOString();
            } else {
              // Try to convert if it's a timestamp or other format
              try {
                createdAtStr = new Date(membership.createdAt as any).toISOString();
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
            } else if (typeof membership.role === 'object') {
              // Extract slug, name, or id from role object (consistent with other code)
              roleValue = (membership.role as any).slug || (membership.role as any).name || (membership.role as any).id || '';
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

    log.debug(`[getUserOrganizationMemberships] ✅ Returning ${enrichedMemberships.length} enriched memberships (cached):`, 
      enrichedMemberships.map(m => `${m.organizationName} (${m.organizationId})`));
    return enrichedMemberships;
  } catch (error: any) {
    logWorkOSError('getUserOrganizationMemberships', error, { userId });
    return [];
  }
}

/**
 * Add user to an organization
 * Requires admin privileges or appropriate permissions
 */
export async function addUserToOrganization(
  userId: string, 
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await workos.userManagement.createOrganizationMembership({
      userId: userId,
      organizationId: organizationId,
    });
    return { success: true };
  } catch (error: any) {
    logWorkOSError('addUserToOrganization', error, { userId, organizationId });
    const errorMessage = getWorkOSErrorMessage(error, 'Failed to add user to organization');
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove user from an organization
 * Requires admin privileges or appropriate permissions
 */
export async function removeUserFromOrganization(
  userId: string, 
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the membership ID first
    // WorkOS SDK returns { data: [] } structure for list operations
    const response = await workos.userManagement.listOrganizationMemberships({
      userId: userId,
    });
    
    // Handle both { data: [] } and direct array responses
    const memberships = Array.isArray(response) ? response : (response?.data || []);

    const membership = memberships?.find(m => m.organizationId === organizationId);
    if (!membership || !membership.id) {
      const errorMessage = 'User is not a member of this organization';
      logWorkOSError('removeUserFromOrganization - membership not found', new Error(errorMessage), {
        userId,
        organizationId,
      });
      return { success: false, error: errorMessage };
    }

    await workos.userManagement.deleteOrganizationMembership(membership.id);
    return { success: true };
  } catch (error: any) {
    logWorkOSError('removeUserFromOrganization', error, { userId, organizationId });
    const errorMessage = getWorkOSErrorMessage(error, 'Failed to remove user from organization');
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user's role in an organization
 * Requires admin privileges or appropriate permissions
 */
export async function updateUserRoleInOrganization(
  userId: string, 
  organizationId: string, 
  newRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info(`[updateUserRoleInOrganization] Updating role for user ${userId} in org ${organizationId} to "${newRole}"`);
    
    // Get the user's organization memberships
    // WorkOS SDK returns { data: [] } structure for list operations
    const response = await workos.userManagement.listOrganizationMemberships({
      userId: userId,
    });
    
    // Handle both { data: [] } and direct array responses
    const memberships = Array.isArray(response) ? response : (response?.data || []);

    // Find the membership for this organization
    const membership = memberships?.find(m => m.organizationId === organizationId);
    
    if (!membership || !membership.id) {
      log.warn(`[updateUserRoleInOrganization] User is not a member of organization ${organizationId}`);
      return { success: false, error: 'User is not a member of this organization' };
    }

    // Update the membership role
    // Note: TypeScript types may not include 'role' in UpdateOrganizationMembershipOptions,
    // but the WorkOS runtime API supports it. Using type assertion to bypass type check.
    await workos.userManagement.updateOrganizationMembership(membership.id, {
      role: newRole,
    } as any);

    log.info(`[updateUserRoleInOrganization] ✅ Successfully updated role to "${newRole}"`);
    return { success: true };
  } catch (error: any) {
    logWorkOSError('updateUserRoleInOrganization', error, { 
      userId, 
      organizationId, 
      newRole 
    });
    const errorMessage = getWorkOSErrorMessage(error, 'Failed to update user role');
    return { success: false, error: errorMessage };
  }
}

