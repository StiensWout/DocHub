import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

/**
 * GET /api/documents/[documentId]/tags
 * Get tags for a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.documentId;
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('type') || 'base'; // 'base' or 'team'

    if (!['base', 'team'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "base" or "team".' },
        { status: 400 }
      );
    }

    // Get tags for the document
    const { data: documentTags, error } = await supabaseAdmin
      .from('document_tags')
      .select(`
        tag_id,
        tags (
          id,
          name,
          slug,
          color
        )
      `)
      .eq('document_id', documentId)
      .eq('document_type', documentType);

    if (error) {
      log.error('Error fetching document tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch document tags' },
        { status: 500 }
      );
    }

    // Transform the response to flatten the structure
    const tags = (documentTags || []).map((dt: any) => dt.tags);

    return NextResponse.json({ tags });
  } catch (error) {
    log.error('Error in GET /api/documents/[documentId]/tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[documentId]/tags
 * Add tags to a document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.documentId;
    const body = await request.json();
    const { tagIds, documentType = 'base' } = body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: 'tagIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!['base', 'team'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "base" or "team".' },
        { status: 400 }
      );
    }

    // Prepare tag associations
    const tagAssociations = tagIds.map((tagId: string) => ({
      document_id: documentId,
      document_type: documentType,
      tag_id: tagId,
    }));

    // Insert tag associations (ignore conflicts for existing tags)
    const { data, error } = await supabaseAdmin
      .from('document_tags')
      .upsert(tagAssociations, {
        onConflict: 'document_id,document_type,tag_id',
        ignoreDuplicates: true,
      })
      .select(`
        tag_id,
        tags (
          id,
          name,
          slug,
          color
        )
      `);

    if (error) {
      log.error('Error adding tags to document:', error);
      return NextResponse.json(
        { error: 'Failed to add tags to document' },
        { status: 500 }
      );
    }

    // Transform the response
    const tags = (data || []).map((dt: any) => dt.tags);

    return NextResponse.json({ tags }, { status: 201 });
  } catch (error) {
    log.error('Error in POST /api/documents/[documentId]/tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[documentId]/tags
 * Remove tags from a document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.documentId;
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('type') || 'base';
    const tagIds = searchParams.get('tagIds');

    if (!['base', 'team'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "base" or "team".' },
        { status: 400 }
      );
    }

    let deleteQuery = supabaseAdmin
      .from('document_tags')
      .delete()
      .eq('document_id', documentId)
      .eq('document_type', documentType);

    // If tagIds provided, delete only those tags; otherwise delete all tags
    if (tagIds) {
      const tagIdArray = tagIds.split(',').map((id) => id.trim());
      deleteQuery = deleteQuery.in('tag_id', tagIdArray);
    }

    const { error } = await deleteQuery;

    if (error) {
      log.error('Error removing tags from document:', error);
      return NextResponse.json(
        { error: 'Failed to remove tags from document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error in DELETE /api/documents/[documentId]/tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

