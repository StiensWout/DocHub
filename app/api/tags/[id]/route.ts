import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PUT /api/tags/[id]
 * Update a tag (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update tags
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const tagId = params.id;
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Validate tag name
    const tagNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!tagNameRegex.test(name.trim())) {
      return NextResponse.json(
        { error: 'Tag name contains invalid characters. Only alphanumeric characters, spaces, hyphens, and underscores are allowed.' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    // Check if another tag with same slug exists (excluding current tag)
    const { data: existingTag } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('slug', slug)
      .neq('id', tagId)
      .single();

    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      );
    }

    // Update the tag
    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .update({
        name: name.trim(),
        slug,
        color: color || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tagId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Error in PUT /api/tags/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tags/[id]
 * Delete a tag (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete tags
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const tagId = params.id;

    // Delete the tag (cascade will handle document_tags)
    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/tags/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

