import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { addUserToOrganization, removeUserFromOrganization } from '@/lib/workos/organizations';
import { log } from '@/lib/logger';

/**
 * POST /api/organizations/membership
 * Add or remove user from WorkOS organization (admin only)
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

    const body = await request.json();
    const { userId, organizationId, action } = body;

    if (!userId || !organizationId || !action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'userId, organizationId, and action (add or remove) are required' },
        { status: 400 }
      );
    }

    log.info(`[POST /api/organizations/membership] ${action} user ${userId} from organization ${organizationId}`);

    let result;
    if (action === 'add') {
      result = await addUserToOrganization(userId, organizationId);
    } else {
      result = await removeUserFromOrganization(userId, organizationId);
    }

    if (!result.success) {
      log.error(`[POST /api/organizations/membership] Failed to ${action} user:`, result.error);
      return NextResponse.json(
        { error: result.error || `Failed to ${action} user from organization` },
        { status: 500 }
      );
    }

    log.info(`[POST /api/organizations/membership] ✅ Successfully ${action === 'add' ? 'added' : 'removed'} user`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    log.error('[POST /api/organizations/membership] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization membership', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

