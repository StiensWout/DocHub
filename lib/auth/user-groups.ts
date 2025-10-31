import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from './session';

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
 */
export async function getUserGroups(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_groups')
      .select('group_name')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user groups:', error);
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

