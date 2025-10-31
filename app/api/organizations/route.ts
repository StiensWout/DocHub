import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { getOrganizations } from '@/lib/workos/organizations';
import { log } from '@/lib/logger';

/**
 * GET /api/organizations
 * Get all WorkOS organizations (admin only)
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

    const organizations = await getOrganizations();
    
    return NextResponse.json({ organizations });
  } catch (error: any) {
    log.error('Error getting organizations:', error);
    return NextResponse.json(
      { error: 'Failed to get organizations' },
      { status: 500 }
    );
  }
}

