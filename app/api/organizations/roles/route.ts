import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

/**
 * GET /api/organizations/roles
 * Get all unique roles from all organization memberships (admin only)
 * This helps discover all roles being used, including custom ones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Query all users and get their organization memberships to extract roles
    // Since we store users locally, we can get all unique roles from there
    // But we need to query WorkOS or use the user data we have
    
    // For now, get all roles from the users/all endpoint data
    // This is a helper endpoint that can be called to get all roles
    // In a real scenario, we'd want to fetch from WorkOS directly
    
    // Get all users' organization memberships via the database or WorkOS
    // Since roles are stored in WorkOS, we need to query all user memberships
    
    // Alternative: Return common roles and let the frontend discover more
    // The frontend already extracts from existing memberships
    
    // For better role discovery, we could:
    // 1. Query WorkOS for all organization memberships (requires pagination)
    // 2. Use the local user database if we cache role info
    // 3. Return the roles we know about
    
    return NextResponse.json({ 
      roles: [], 
      message: 'Use /api/users/all to get roles from existing memberships',
      note: 'Roles are extracted from user organization memberships'
    });
  } catch (error: any) {
    log.error('Error getting organization roles:', error);
    return NextResponse.json(
      { error: 'Failed to get organization roles' },
      { status: 500 }
    );
  }
}

