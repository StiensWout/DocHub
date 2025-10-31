import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

/**
 * POST /api/documents/access
 * Set document access groups (admin only)
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
    const { documentId, groups } = body;

    if (!documentId || !Array.isArray(groups)) {
      return NextResponse.json(
        { error: 'documentId and groups array are required' },
        { status: 400 }
      );
    }

    // Remove existing access groups for document
    await supabaseAdmin
      .from('document_access_groups')
      .delete()
      .eq('team_document_id', documentId);

    // Add new access groups
    if (groups.length > 0) {
      const accessInserts = groups.map(groupName => ({
        team_document_id: documentId,
        group_name: groupName,
      }));

      const { error } = await supabaseAdmin
        .from('document_access_groups')
        .insert(accessInserts);

      if (error) {
        log.error('Error setting document access:', error);
        return NextResponse.json(
          { error: 'Failed to set document access' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    log.error('Error setting document access:', error);
    return NextResponse.json(
      { error: 'Failed to set document access' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/access?documentId=xxx
 * Get document access groups
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('document_access_groups')
      .select('group_name')
      .eq('team_document_id', documentId);

    if (error) {
      log.error('Error fetching document access:', error);
      return NextResponse.json(
        { error: 'Failed to get document access' },
        { status: 500 }
      );
    }

    const groups = (data || []).map(d => d.group_name);

    return NextResponse.json({ groups });
  } catch (error: any) {
    log.error('Error getting document access:', error);
    return NextResponse.json(
      { error: 'Failed to get document access' },
      { status: 500 }
    );
  }
}

