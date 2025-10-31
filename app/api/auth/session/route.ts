import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    // NOTE: Team sync happens during authentication (signin/callback endpoints)
    // Not here, because /api/auth/session is called frequently and would cause
    // unnecessary duplicate syncs. Teams are synced once per login.

    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    log.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
}

