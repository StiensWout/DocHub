import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserGroups, isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { validateUUID, validateEnum, DocumentType } from '@/lib/validation/api-validation';

/**
 * POST /api/documents/validate-access
 * Validate if current user has access to a specific document
 */
export async function POST(request: NextRequest) {
  try {
    log.info('[validate-access] Request received');
    const session = await getSession();
    if (!session) {
      log.warn('[validate-access] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('[validate-access] Session found', { userId: session.user.id });

    const body = await request.json();
    const { documentId, documentType, teamId, appId } = body;

    log.info('[validate-access] Request body', { documentId, documentType, teamId, appId });

    if (!documentId || !documentType || !teamId || !appId) {
      log.warn('[validate-access] Missing required fields');
      return NextResponse.json(
        { error: 'documentId, documentType, teamId, and appId are required' },
        { status: 400 }
      );
    }

    // Validate UUID formats
    const documentIdValidation = validateUUID(documentId, 'documentId');
    if (!documentIdValidation.valid) {
      return NextResponse.json(
        { error: documentIdValidation.error },
        { status: 400 }
      );
    }

    const teamIdValidation = validateUUID(teamId, 'teamId');
    if (!teamIdValidation.valid) {
      return NextResponse.json(
        { error: teamIdValidation.error },
        { status: 400 }
      );
    }

    const appIdValidation = validateUUID(appId, 'appId');
    if (!appIdValidation.valid) {
      return NextResponse.json(
        { error: appIdValidation.error },
        { status: 400 }
      );
    }

    // Validate documentType enum
    const documentTypeValidation = validateEnum(documentType, DocumentType, 'documentType');
    if (!documentTypeValidation.valid) {
      return NextResponse.json(
        { error: documentTypeValidation.error },
        { status: 400 }
      );
    }

    log.info('[validate-access] Checking admin status');
    const userIsAdmin = await isAdmin();
    log.info('[validate-access] Admin status', { userIsAdmin });

    log.info('[validate-access] Getting user groups');
    const userGroups = await getUserGroups(session.user.id);
    log.info('[validate-access] User groups', { userGroups, count: userGroups.length });

    const validatedDocumentType = documentTypeValidation.value!;
    
    if (validatedDocumentType === 'base') {
      // Base documents are always accessible
      log.info('[validate-access] Base document - access granted');
      return NextResponse.json({ hasAccess: true });
    }

    if (validatedDocumentType === 'team') {
      // Team documents require group access or admin
      if (userIsAdmin) {
        log.info('[validate-access] Admin user - access granted');
        return NextResponse.json({ hasAccess: true });
      }

      // Check if user has access via document_access_groups
      if (userGroups.length > 0) {
        log.info('[validate-access] Checking document_access_groups', {
          documentId,
          userGroups,
        });

        const { data: accessData, error: accessError } = await supabaseAdmin
          .from('document_access_groups')
          .select('team_document_id')
          .eq('team_document_id', documentId)
          .in('group_name', userGroups)
          .limit(1); // Use limit(1) instead of .single() to handle multiple group memberships

        log.info('[validate-access] Database query result', {
          hasData: !!accessData,
          dataLength: accessData?.length || 0,
          hasError: !!accessError,
          error: accessError?.message,
          errorCode: accessError?.code,
        });

        if (accessError) {
          // Handle specific error codes
          // PGRST116 = no rows found (expected if user has no access)
          // PGRST118 = multiple rows found (shouldn't happen with limit(1), but handle gracefully)
          // Other errors = database/network issues (fail open)
          if (accessError.code === 'PGRST116') {
            // No rows found - user doesn't have access via any of their groups
            log.info('[validate-access] No access found (PGRST116)');
            // Fall through to return hasAccess: false
          } else if (accessError.code === 'PGRST118') {
            // Multiple rows found - this shouldn't happen with limit(1), but if it does,
            // user has access via multiple groups, so grant access
            log.warn('[validate-access] Multiple rows found (PGRST118) - granting access as user has access via multiple groups');
            return NextResponse.json({ hasAccess: true });
          } else {
            // Other errors (network, database issues) - fail open
            log.error('[validate-access] Error checking document access:', accessError);
            log.info('[validate-access] Failing open due to error (not PGRST116/118)');
            return NextResponse.json({ hasAccess: true });
          }
        }

        if (accessData && accessData.length > 0) {
          log.info('[validate-access] Access found in document_access_groups');
          return NextResponse.json({ hasAccess: true });
        }

        log.warn('[validate-access] No access found in document_access_groups');
      } else {
        log.warn('[validate-access] User has no groups');
      }

      log.warn('[validate-access] Access denied');
      return NextResponse.json({ hasAccess: false });
    }

    log.warn('[validate-access] Unknown document type', { documentType });
    return NextResponse.json({ hasAccess: false });
  } catch (error: any) {
    log.error('[validate-access] Exception:', error);
    // Fail open - if there's an error, allow access (user already passed GET /api/documents filter)
    log.info('[validate-access] Failing open due to exception');
    return NextResponse.json({ hasAccess: true });
  }
}

