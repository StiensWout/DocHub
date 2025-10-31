import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/server';

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
      console.error('Error creating application:', error);
      
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
    console.error('Unexpected error creating application:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/applications
 * Get all applications
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ applications: data || [] });
  } catch (error: any) {
    console.error('Unexpected error fetching applications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

