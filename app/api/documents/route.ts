import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserGroups, isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

/**
 * POST /api/documents/validate-access
 * Validate if current user has access to a specific document
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, documentType, teamId, appId } = body;

    if (!documentId || !documentType || !teamId || !appId) {
      return NextResponse.json(
        { error: 'documentId, documentType, teamId, and appId are required' },
        { status: 400 }
      );
    }

    const userIsAdmin = await isAdmin();
    const userGroups = await getUserGroups(session.user.id);

    if (documentType === 'base') {
      // Base documents are always accessible
      return NextResponse.json({ hasAccess: true });
    }

    if (documentType === 'team') {
      // Team documents require group access or admin
      if (userIsAdmin) {
        return NextResponse.json({ hasAccess: true });
      }

      // Check if user has access via document_access_groups
      if (userGroups.length > 0) {
        const { data: accessData, error: accessError } = await supabaseAdmin
          .from('document_access_groups')
          .select('team_document_id')
          .eq('team_document_id', documentId)
          .in('group_name', userGroups)
          .single();

        if (accessError && accessError.code !== 'PGRST116') {
          log.error('Error checking document access:', accessError);
          return NextResponse.json({ hasAccess: false });
        }

        if (accessData) {
          return NextResponse.json({ hasAccess: true });
        }
      }

      return NextResponse.json({ hasAccess: false });
    }

    return NextResponse.json({ hasAccess: false });
  } catch (error: any) {
    log.error('Error validating document access:', error);
    return NextResponse.json({ hasAccess: false }, { status: 500 });
  }
}

/**
 * GET /api/documents?teamId=xxx&appId=xxx
 * Get documents filtered by user's groups
 * Admins see all documents
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const appId = searchParams.get('appId');

    if (!teamId || !appId) {
      return NextResponse.json(
        { error: 'teamId and appId are required' },
        { status: 400 }
      );
    }

    const userIsAdmin = await isAdmin();
    const userGroups = await getUserGroups(session.user.id);

    // Get base documents (always visible to all users)
    const { data: baseDocs, error: baseError } = await supabaseAdmin
      .from('base_documents')
      .select('*')
      .eq('application_id', appId)
      .order('updated_at', { ascending: false });

    if (baseError) {
      log.error('Error fetching base documents:', baseError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Get team documents
    let teamDocsQuery = supabaseAdmin
      .from('team_documents')
      .select('*')
      .eq('team_id', teamId)
      .eq('application_id', appId);

    // If not admin, filter by user groups via document_access_groups
    if (!userIsAdmin) {
      if (userGroups.length > 0) {
        // Get document IDs accessible to user's groups
        const { data: accessibleDocs, error: accessError } = await supabaseAdmin
          .from('document_access_groups')
          .select('team_document_id')
          .in('group_name', userGroups);

        if (accessError) {
          log.error('Error fetching accessible documents:', accessError);
        }

        const accessibleDocIds = accessibleDocs?.map(d => d.team_document_id) || [];
        
        if (accessibleDocIds.length > 0) {
          teamDocsQuery = teamDocsQuery.in('id', accessibleDocIds);
        } else {
          // User has groups but no accessible documents
          teamDocsQuery = teamDocsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Return nothing
        }
      } else {
        // Non-admin user with no groups has no access to team documents
        teamDocsQuery = teamDocsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Return nothing
      }
    }

    const { data: teamDocs, error: teamError } = await teamDocsQuery.order('updated_at', { ascending: false });

    if (teamError) {
      log.error('Error fetching team documents:', teamError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Format documents
    const formatDocument = (doc: any, type: 'base' | 'team') => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      type,
      content: doc.content || undefined,
      updated: formatTimeAgo(doc.updated_at),
      appId: doc.application_id,
    });

    const baseDocuments = (baseDocs || []).map(doc => formatDocument(doc, 'base'));
    const teamDocuments = (teamDocs || []).map(doc => formatDocument(doc, 'team'));

    return NextResponse.json({
      documents: [...baseDocuments, ...teamDocuments],
      isAdmin: userIsAdmin,
      userGroups,
    });
  } catch (error: any) {
    log.error('Error getting documents:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  }
}

