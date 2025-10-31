import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { syncAllUsersFromWorkOS, syncUserFromWorkOS } from '@/lib/workos/user-sync';

/**
 * POST /api/users/sync
 * Sync users from WorkOS to local database (admin only)
 * 
 * Query params:
 * - userId: Optional - sync single user by WorkOS user ID
 * - full: Optional - perform full sync of all users (default: false)
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const full = searchParams.get('full') === 'true';

    if (userId) {
      // Sync single user
      console.log(`[POST /api/users/sync] Syncing single user: ${userId}`);
      const user = await syncUserFromWorkOS(userId);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found in WorkOS' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `User ${userId} synced successfully`,
        user,
      });
    } else if (full) {
      // Sync all users
      console.log('[POST /api/users/sync] Starting full user sync');
      const result = await syncAllUsersFromWorkOS();
      
      return NextResponse.json({
        success: true,
        message: `Synced ${result.synced} users, ${result.errors} errors`,
        ...result,
      });
    } else {
      return NextResponse.json(
        { error: 'Please specify userId query param or full=true for full sync' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error syncing users:', error);
    return NextResponse.json(
      { error: `Failed to sync users: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/sync
 * Get sync status or trigger sync (admin only)
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

    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger') === 'true';

    if (trigger) {
      // Trigger full sync
      console.log('[GET /api/users/sync] Triggering full sync');
      const result = await syncAllUsersFromWorkOS();
      
      return NextResponse.json({
        success: true,
        message: `Synced ${result.synced} users, ${result.errors} errors`,
        ...result,
      });
    } else {
      // Return sync status/info
      return NextResponse.json({
        message: 'Use POST /api/users/sync?full=true to sync all users, or POST /api/users/sync?userId=xxx for single user',
      });
    }
  } catch (error: any) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json(
      { error: `Failed: ${error.message}` },
      { status: 500 }
    );
  }
}

