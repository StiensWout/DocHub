import { workos } from './server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

/**
 * WorkOS User Sync Utilities
 * 
 * This module provides functions to sync users from WorkOS to the local database.
 * WorkOS remains the master source of truth - local copy enables:
 * - Offline admin access to user data
 * - Faster queries without WorkOS API calls
 * - Local tracking and analytics
 * 
 * All changes made locally should be synced back to WorkOS.
 */

export interface LocalUser {
  id: string;
  workos_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified: boolean;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
  synced_from_workos: boolean;
}

export interface UserSettings {
  id: string;
  user_id: string;
  workos_user_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Sync a single user from WorkOS to local database
 * Creates or updates the user record
 */
export async function syncUserFromWorkOS(workosUserId: string): Promise<LocalUser | null> {
  try {
    log.debug(`[syncUserFromWorkOS] Syncing user: ${workosUserId}`);
    
    // Fetch user from WorkOS
    const workosUser = await workos.userManagement.getUser(workosUserId);
    
    if (!workosUser) {
      log.warn(`[syncUserFromWorkOS] User ${workosUserId} not found in WorkOS`);
      return null;
    }
    
    // Prepare user data
    const userData = {
      workos_user_id: workosUser.id,
      email: workosUser.email || '',
      first_name: workosUser.firstName || null,
      last_name: workosUser.lastName || null,
      email_verified: workosUser.emailVerified || false,
      profile_picture_url: workosUser.profilePictureUrl || null,
      last_synced_at: new Date().toISOString(),
      synced_from_workos: true,
    };
    
    // Upsert user (insert or update)
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(userData, {
        onConflict: 'workos_user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (error) {
      log.error(`[syncUserFromWorkOS] Error upserting user:`, error);
      throw error;
    }
    
    log.info(`[syncUserFromWorkOS] ✅ Successfully synced user ${workosUserId}`);
    return data as LocalUser;
  } catch (error: any) {
    log.error(`[syncUserFromWorkOS] Exception syncing user ${workosUserId}:`, error);
    
    // Handle case where user might be SSO user (not in User Management)
    if (error.code === 'not_found' || error.message?.includes('not found')) {
      log.debug(`[syncUserFromWorkOS] User ${workosUserId} might be SSO user, skipping sync`);
      return null;
    }
    
    throw error;
  }
}

/**
 * Sync all users from WorkOS to local database
 * This is useful for initial sync or periodic full sync
 */
export async function syncAllUsersFromWorkOS(): Promise<{ synced: number; errors: number }> {
  try {
    log.info('[syncAllUsersFromWorkOS] Starting full user sync from WorkOS');
    
    let synced = 0;
    let errors = 0;
    let cursor: string | undefined = undefined;
    
    do {
      // Fetch users from WorkOS (paginated)
      const { data: users, nextCursor } = await workos.userManagement.listUsers({
        cursor,
        limit: 100, // WorkOS default limit
      });
      
      if (!users || users.length === 0) {
        break;
      }
      
      log.debug(`[syncAllUsersFromWorkOS] Fetched ${users.length} users from WorkOS`);
      
      // Sync each user
      for (const user of users) {
        try {
          await syncUserFromWorkOS(user.id);
          synced++;
        } catch (error: any) {
          log.error(`[syncAllUsersFromWorkOS] Error syncing user ${user.id}:`, error);
          errors++;
        }
      }
      
      cursor = nextCursor || undefined;
    } while (cursor);
    
    log.info(`[syncAllUsersFromWorkOS] ✅ Sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  } catch (error: any) {
    log.error('[syncAllUsersFromWorkOS] Exception during full sync:', error);
    throw error;
  }
}

/**
 * Get user from local database by WorkOS user ID
 */
export async function getLocalUser(workosUserId: string): Promise<LocalUser | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('workos_user_id', workosUserId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // User not found
        return null;
      }
      throw error;
    }
    
    return data as LocalUser;
  } catch (error: any) {
    log.error(`[getLocalUser] Error fetching user ${workosUserId}:`, error);
    throw error;
  }
}

/**
 * Get all users from local database
 */
export async function getAllLocalUsers(): Promise<LocalUser[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('email');
    
    if (error) {
      throw error;
    }
    
    return (data || []) as LocalUser[];
  } catch (error: any) {
    log.error('[getAllLocalUsers] Error fetching users:', error);
    throw error;
  }
}

/**
 * Update user settings in local database
 * Also attempts to sync to WorkOS user metadata if possible
 */
export async function updateUserSettings(
  workosUserId: string,
  settings: Record<string, any>
): Promise<UserSettings> {
  try {
    log.debug(`[updateUserSettings] Updating settings for user: ${workosUserId}`);
    
    // Get or create local user record
    let localUser = await getLocalUser(workosUserId);
    
    if (!localUser) {
      // Try to sync from WorkOS first
      localUser = await syncUserFromWorkOS(workosUserId);
      
      if (!localUser) {
        throw new Error(`User ${workosUserId} not found locally or in WorkOS`);
      }
    }
    
    // Update or create settings
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({
        user_id: localUser.id,
        workos_user_id: workosUserId,
        settings: settings,
      }, {
        onConflict: 'workos_user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Try to sync settings to WorkOS user metadata
    try {
      await workos.userManagement.updateUser(workosUserId, {
        metadata: settings,
      });
      log.info(`[updateUserSettings] ✅ Synced settings to WorkOS for user ${workosUserId}`);
    } catch (workosError: any) {
      // Non-fatal - settings stored locally even if WorkOS sync fails
      log.warn(`[updateUserSettings] Could not sync settings to WorkOS:`, workosError.message);
    }
    
    return data as UserSettings;
  } catch (error: any) {
    log.error(`[updateUserSettings] Error updating user settings:`, error);
    throw error;
  }
}

/**
 * Get user settings from local database
 */
export async function getUserSettings(workosUserId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('workos_user_id', workosUserId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Settings not found
        return null;
      }
      throw error;
    }
    
    return data as UserSettings;
  } catch (error: any) {
    log.error(`[getUserSettings] Error fetching settings for ${workosUserId}:`, error);
    throw error;
  }
}

/**
 * Update local user and sync to WorkOS
 * This should be used when admin makes changes - syncs back to WorkOS
 */
export async function updateUserAndSyncToWorkOS(
  workosUserId: string,
  updates: {
    email?: string;
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    profilePictureUrl?: string;
  }
): Promise<LocalUser> {
  try {
    log.debug(`[updateUserAndSyncToWorkOS] Updating user ${workosUserId} and syncing to WorkOS`);
    
    // Update in WorkOS first (master source)
    const workosUpdates: any = {};
    if (updates.email !== undefined) workosUpdates.email = updates.email;
    if (updates.firstName !== undefined) workosUpdates.firstName = updates.firstName;
    if (updates.lastName !== undefined) workosUpdates.lastName = updates.lastName;
    if (updates.emailVerified !== undefined) workosUpdates.emailVerified = updates.emailVerified;
    if (updates.profilePictureUrl !== undefined) workosUpdates.profilePictureUrl = updates.profilePictureUrl;
    
    try {
      await workos.userManagement.updateUser(workosUserId, workosUpdates);
      log.info(`[updateUserAndSyncToWorkOS] ✅ Updated user in WorkOS`);
    } catch (workosError: any) {
      log.error(`[updateUserAndSyncToWorkOS] Error updating user in WorkOS:`, workosError);
      // Continue to update local copy even if WorkOS update fails
      log.warn(`[updateUserAndSyncToWorkOS] Continuing with local update despite WorkOS error`);
    }
    
    // Update local database
    const localUpdates: any = {};
    if (updates.email !== undefined) localUpdates.email = updates.email;
    if (updates.firstName !== undefined) localUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) localUpdates.last_name = updates.lastName;
    if (updates.emailVerified !== undefined) localUpdates.email_verified = updates.emailVerified;
    if (updates.profilePictureUrl !== undefined) localUpdates.profile_picture_url = updates.profilePictureUrl;
    localUpdates.last_synced_at = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(localUpdates)
      .eq('workos_user_id', workosUserId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    log.info(`[updateUserAndSyncToWorkOS] ✅ Updated local user record`);
    return data as LocalUser;
  } catch (error: any) {
    log.error(`[updateUserAndSyncToWorkOS] Exception updating user:`, error);
    throw error;
  }
}

