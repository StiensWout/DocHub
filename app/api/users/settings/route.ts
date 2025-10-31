import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { getUserSettings, updateUserSettings } from '@/lib/workos/user-sync';

/**
 * GET /api/users/settings?userId=xxx
 * Get user settings (admin can get any user's settings, users can only get their own)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    
    // Users can only view their own settings unless they're admin
    const userIsAdmin = await isAdmin();
    if (userId !== session.user.id && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Can only view own settings' },
        { status: 403 }
      );
    }

    const settings = await getUserSettings(userId);
    
    if (!settings) {
      return NextResponse.json({
        userId,
        settings: {},
      });
    }

    return NextResponse.json({
      userId: settings.workos_user_id,
      settings: settings.settings,
    });
  } catch (error: any) {
    console.error('Error getting user settings:', error);
    return NextResponse.json(
      { error: `Failed to get settings: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/settings
 * Update user settings
 * Body: { userId?: string, settings: Record<string, any> }
 * - Users can only update their own settings unless they're admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    const targetUserId = userId || session.user.id;
    
    // Users can only update their own settings unless they're admin
    const userIsAdmin = await isAdmin();
    if (targetUserId !== session.user.id && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Can only update own settings' },
        { status: 403 }
      );
    }

    const updatedSettings = await updateUserSettings(targetUserId, settings);
    
    return NextResponse.json({
      success: true,
      userId: updatedSettings.workos_user_id,
      settings: updatedSettings.settings,
    });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: `Failed to update settings: ${error.message}` },
      { status: 500 }
    );
  }
}

