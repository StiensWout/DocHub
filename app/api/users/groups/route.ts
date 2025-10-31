import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserGroups, isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/users/groups
 * Get current user's groups or all users (if admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // If userId is specified and user is admin, get that user's groups
    if (userId) {
      const userIsAdmin = await isAdmin();
      if (!userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
      }

      const groups = await getUserGroups(userId);
      return NextResponse.json({ groups });
    }

    // Otherwise return current user's groups
    const groups = await getUserGroups(session.user.id);
    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Error getting user groups:', error);
    return NextResponse.json(
      { error: 'Failed to get user groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/groups
 * Assign user to groups (admin only)
 * 
 * NOTE: If using WorkOS Organizations (WORKOS_USE_ORGANIZATIONS=true),
 * groups are managed via WorkOS Organizations and should be updated
 * through WorkOS Dashboard or Organization API. This endpoint will
 * work in database fallback mode.
 * 
 * TODO: Add WorkOS Organization management support for adding/removing
 * users from organizations programmatically.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Check if using WorkOS Organizations
    const useWorkOSGroups = process.env.WORKOS_USE_ORGANIZATIONS === 'true';
    
    if (useWorkOSGroups) {
      return NextResponse.json(
        { 
          error: 'Groups are managed via WorkOS Organizations. Please update organization memberships in WorkOS Dashboard or use the WorkOS Organizations API.',
          hint: 'Use workos.organizations.createOrganizationMembership() to add users to organizations'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, groups } = body;

    if (!userId || !Array.isArray(groups)) {
      return NextResponse.json(
        { error: 'userId and groups array are required' },
        { status: 400 }
      );
    }

    // Remove existing groups for user
    await supabaseAdmin
      .from('user_groups')
      .delete()
      .eq('user_id', userId);

    // Add new groups
    if (groups.length > 0) {
      const groupInserts = groups.map(groupName => ({
        user_id: userId,
        group_name: groupName,
      }));

      const { error } = await supabaseAdmin
        .from('user_groups')
        .insert(groupInserts);

      if (error) {
        console.error('Error assigning user groups:', error);
        return NextResponse.json(
          { error: 'Failed to assign user groups' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error assigning user groups:', error);
    return NextResponse.json(
      { error: 'Failed to assign user groups' },
      { status: 500 }
    );
  }
}

