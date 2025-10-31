import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { updateUserAndSyncToWorkOS, syncUserFromWorkOS } from '@/lib/workos/user-sync';

/**
 * POST /api/users/update
 * Update user information (admin only)
 * Body: { userId: string, email?: string, firstName?: string, lastName?: string, emailVerified?: boolean, profilePictureUrl?: string }
 * All changes are synced to WorkOS (master source)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, email, firstName, lastName, emailVerified, profilePictureUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Update user and sync to WorkOS
    const updatedUser = await updateUserAndSyncToWorkOS(userId, {
      email,
      firstName,
      lastName,
      emailVerified,
      profilePictureUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'User updated and synced to WorkOS',
      user: {
        id: updatedUser.id,
        workos_user_id: updatedUser.workos_user_id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email_verified: updatedUser.email_verified,
        profile_picture_url: updatedUser.profile_picture_url,
        last_synced_at: updatedUser.last_synced_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: `Failed to update user: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/sync-single
 * Sync a single user from WorkOS to local database (admin only)
 * Body: { userId: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Sync user from WorkOS
    const user = await syncUserFromWorkOS(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in WorkOS' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User synced from WorkOS',
      user,
    });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: `Failed to sync user: ${error.message}` },
      { status: 500 }
    );
  }
}

