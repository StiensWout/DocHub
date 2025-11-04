import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { validateUUID, validateEnum, validateUUIDArray, DocumentType } from '@/lib/validation/api-validation';

/**
 * Retrieve tag objects associated with a specific document.
 *
 * Requires an authenticated session. Validates `documentId` as a UUID and the optional `type` query parameter against `DocumentType`. Returns 401 if unauthenticated, 400 for validation failures, and 500 for server or database errors.
 *
 * @param request - Incoming request; may include the `type` query parameter to filter by document type (`base` or `team`).
 * @param params.documentId - The document's UUID.
 * @returns An object with a `tags` array containing tag objects (`id`, `name`, `slug`, `color`).
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
    
    // Validate documentId UUID format
    const documentIdValidation = validateUUID(documentId, 'documentId');
    if (!documentIdValidation.valid) {
      return NextResponse.json(
        { error: documentIdValidation.error },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('type') || 'base'; // 'base' or 'team'

    // Validate documentType enum
    const documentTypeValidation = validateEnum(documentType, DocumentType, 'documentType');
    if (!documentTypeValidation.valid) {
      return NextResponse.json(
        { error: documentTypeValidation.error },
        { status: 400 }
      );
    }

    const validatedDocumentType = documentTypeValidation.value!;

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
      .eq('document_type', validatedDocumentType);

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
 * Associate one or more existing tags with the specified document and return the associated tag objects.
 *
 * @returns The response body: on success, an object with `tags` — an array of tag objects (`id`, `name`, `slug`, `color`); on error, an object with `error` describing the failure.
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
    
    // Validate documentId UUID format
    const documentIdValidation = validateUUID(documentId, 'documentId');
    if (!documentIdValidation.valid) {
      return NextResponse.json(
        { error: documentIdValidation.error },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tagIds, documentType = 'base' } = body;

    // Validate tagIds array (must have at least one tag)
    const tagIdsValidation = validateUUIDArray(tagIds, 'tagIds', false, 1);
    if (!tagIdsValidation.valid) {
      return NextResponse.json(
        { error: tagIdsValidation.error },
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

    const validatedDocumentType = documentTypeValidation.value!;

    // Prepare tag associations
    const tagAssociations = tagIds.map((tagId: string) => ({
      document_id: documentId,
      document_type: validatedDocumentType,
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
 * Remove one or more tag associations from a document.
 *
 * Validates authentication, the `documentId` UUID, the optional `type` query enum (defaults to `base`),
 * and an optional `tagIds` query containing a comma-separated list of tag UUIDs. If `tagIds` is provided,
 * only those tag associations are removed; otherwise all tags for the document and type are removed.
 *
 * @param params.documentId - The UUID of the document to modify
 * @returns A JSON object `{ success: true }` on success. On failure returns a JSON error message with an appropriate HTTP status (`401` for unauthorized, `400` for validation errors, `500` for server/database errors).
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
    
    // Validate documentId UUID format
    const documentIdValidation = validateUUID(documentId, 'documentId');
    if (!documentIdValidation.valid) {
      return NextResponse.json(
        { error: documentIdValidation.error },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('type') || 'base';

    // Validate documentType enum
    const documentTypeValidation = validateEnum(documentType, DocumentType, 'documentType');
    if (!documentTypeValidation.valid) {
      return NextResponse.json(
        { error: documentTypeValidation.error },
        { status: 400 }
      );
    }

    const validatedDocumentType = documentTypeValidation.value!;

    const tagIds = searchParams.get('tagIds');

    let deleteQuery = supabaseAdmin
      .from('document_tags')
      .delete()
      .eq('document_id', documentId)
      .eq('document_type', validatedDocumentType);

    // If tagIds provided, delete only those tags; otherwise delete all tags
    if (tagIds) {
      const tagIdArray = tagIds.split(',').map((id) => id.trim());
      // Validate each tagId is a valid UUID
      for (const tagId of tagIdArray) {
        const tagIdValidation = validateUUID(tagId, 'tagId');
        if (!tagIdValidation.valid) {
          return NextResponse.json(
            { error: tagIdValidation.error },
            { status: 400 }
          );
        }
      }
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
