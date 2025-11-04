import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserGroups, isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { validateUUID, validateArray } from '@/lib/validation/api-validation';

/**
 * Retrieve groups for the current user or for a specified user when requested by an admin.
 *
 * When a `userId` query parameter is provided, the `userId` is validated and the caller must be an admin to retrieve that user's groups; otherwise the groups for the authenticated session user are returned.
 *
 * @returns A JSON response. On success returns `{ groups }`. Possible error responses:
 * - `401` when there is no authenticated session
 * - `400` for invalid `userId` format
 * - `403` when a non-admin requests another user's groups
 * - `500` on internal errors
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
      // Validate userId UUID format
      const userIdValidation = validateUUID(userId, 'userId');
      if (!userIdValidation.valid) {
        return NextResponse.json(
          { error: userIdValidation.error },
          { status: 400 }
        );
      }

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
    log.error('Error getting user groups:', error);
    return NextResponse.json(
      { error: 'Failed to get user groups' },
      { status: 500 }
    );
  }
}

/**
 * Assigns (replaces) the groups for a specified user; admin-only HTTP handler.
 *
 * Validates the request body for a `userId` UUID and a `groups` array of non-empty strings.
 * If WorkOS Organizations mode is enabled, the endpoint rejects changes and instructs to use WorkOS instead.
 *
 * @param request - Incoming NextRequest whose JSON body must include `{ userId: string, groups: string[] }`
 * @returns JSON response: `{ success: true }` on success, or an `{ error: string }` object with an appropriate HTTP status code (401, 403, 400, or 500) on failure
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

    // Validate userId UUID format
    const userIdValidation = validateUUID(userId, 'userId');
    if (!userIdValidation.valid) {
      return NextResponse.json(
        { error: userIdValidation.error },
        { status: 400 }
      );
    }

    // Validate groups array
    const groupsValidation = validateArray(groups, 'groups', 0);
    if (!groupsValidation.valid) {
      return NextResponse.json(
        { error: groupsValidation.error },
        { status: 400 }
      );
    }

    // Validate that all group names are strings
    if (!groups.every(g => typeof g === 'string' && g.trim().length > 0)) {
      return NextResponse.json(
        { error: 'All group names must be non-empty strings' },
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
        log.error('Error assigning user groups:', error);
        return NextResponse.json(
          { error: 'Failed to assign user groups' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    log.error('Error assigning user groups:', error);
    return NextResponse.json(
      { error: 'Failed to assign user groups' },
      { status: 500 }
    );
  }
}
