import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { validateUUID, validateArray } from '@/lib/validation/api-validation';

/**
 * Set the access groups for a specific document; requires an authenticated admin session.
 *
 * @param request - NextRequest whose JSON body must include `documentId` (UUID string) and `groups` (array of non-empty strings)
 * @returns A JSON response object: on success `{ success: true }`; on failure an object with an `error` message and an appropriate HTTP status
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

    // Validate documentId UUID format
    const documentIdValidation = validateUUID(documentId, 'documentId');
    if (!documentIdValidation.valid) {
      return NextResponse.json(
        { error: documentIdValidation.error },
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
 * Retrieve access group names for a document specified by the `documentId` query parameter.
 *
 * Requires an active user session and validates `documentId` as a UUID before querying.
 *
 * @param request - Incoming request whose query must include `documentId` (UUID) identifying the document.
 * @returns An object with `groups`: a string array of access group names for the document. On error returns a JSON error object with an appropriate HTTP status (`401` when unauthorized, `400` for validation/missing parameter errors, `500` for server or query errors).
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

    // Validate documentId UUID format
    const documentIdValidation = validateUUID(documentId, 'documentId');
    if (!documentIdValidation.valid) {
      return NextResponse.json(
        { error: documentIdValidation.error },
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
