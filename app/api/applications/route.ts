import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserGroups, isAdmin } from '@/lib/auth/user-groups';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { validateUUID, validateString } from '@/lib/validation/api-validation';

/**
 * POST /api/applications
 * Create a new application (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, iconName, color, groupId } = body;

    // Validate required fields
    if (!id || !name || !iconName || !color) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, iconName, color' },
        { status: 400 }
      );
    }

    // Validate application ID format (UUID)
    const idValidation = validateUUID(id, 'Application ID');
    if (!idValidation.valid) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }

    // Validate name
    const nameValidation = validateString(name, 'Application name', 1, 255);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    // Validate iconName
    const iconValidation = validateString(iconName, 'Icon name', 1, 100);
    if (!iconValidation.valid) {
      return NextResponse.json(
        { error: iconValidation.error },
        { status: 400 }
      );
    }

    // Validate color format (basic hex color validation)
    if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a valid hex color format (#RRGGBB)' },
        { status: 400 }
      );
    }

    // Validate groupId if provided (must be UUID)
    if (groupId !== null && groupId !== undefined) {
      const groupIdValidation = validateUUID(groupId, 'Group ID');
      if (!groupIdValidation.valid) {
        return NextResponse.json(
          { error: groupIdValidation.error },
          { status: 400 }
        );
      }
    }

    // Check if application ID already exists
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this ID already exists' },
        { status: 409 }
      );
    }

    // Create the application
    const { error } = await supabaseAdmin
      .from('applications')
      .insert({
        id,
        name: name.trim(),
        icon_name: iconName,
        color,
        group_id: groupId || null,
      });

    if (error) {
      log.error('Error creating application:', error);
      
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An application with this ID already exists' },
          { status: 409 }
        );
      }
      
      if (error.code === '42501') {
        return NextResponse.json(
          { error: 'Permission denied. Please check RLS policies.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    log.error('Unexpected error creating application:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/applications
 * Get applications filtered by user permissions
 * Requires authentication
 * Admin users see all applications
 * Regular users see all applications (applications are shared across teams)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    const userGroups = await getUserGroups(session.user.id);

    log.debug('[GET /api/applications] Fetching applications', {
      userId: session.user.id,
      isAdmin: userIsAdmin,
      userGroups: userGroups.length,
    });

    // Applications are shared across all teams, so we return all applications
    // Admin users see all applications
    // Regular users also see all applications (access control is at document level)
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .order('name');

    if (error) {
      log.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    log.debug('[GET /api/applications] Successfully fetched applications', {
      count: data?.length || 0,
      isAdmin: userIsAdmin,
    });

    return NextResponse.json({ 
      applications: data || [],
      isAdmin: userIsAdmin,
      userGroups,
    });
  } catch (error: any) {
    log.error('Unexpected error fetching applications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

