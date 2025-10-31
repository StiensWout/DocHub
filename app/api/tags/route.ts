import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

/**
 * GET /api/tags
 * Get all tags (read-only for all authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q'); // Optional search query

    let tagsQuery = supabaseAdmin
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    // If query provided, filter by name
    if (query) {
      tagsQuery = tagsQuery.ilike('name', `%${query}%`);
    }

    const { data: tags, error } = await tagsQuery;

    if (error) {
      log.error('Error fetching tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tags: tags || [] });
  } catch (error) {
    log.error('Error in GET /api/tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags
 * Create a new tag (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create tags
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Validate tag name (alphanumeric, spaces, hyphens, underscores only)
    const tagNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!tagNameRegex.test(name.trim())) {
      return NextResponse.json(
        { error: 'Tag name contains invalid characters. Only alphanumeric characters, spaces, hyphens, and underscores are allowed.' },
        { status: 400 }
      );
    }

    // Create slug from name (lowercase, replace spaces with hyphens, remove special chars)
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    // Check if tag with same slug already exists
    const { data: existingTag } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      );
    }

    // Create the tag
    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .insert({
        name: name.trim(),
        slug,
        color: color || null,
      })
      .select()
      .single();

    if (error) {
      log.error('Error creating tag:', error);
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    log.error('Error in POST /api/tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

