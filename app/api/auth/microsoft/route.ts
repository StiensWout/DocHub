import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirectUri = searchParams.get('redirect_uri') || process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_WORKOS_CLIENT_ID environment variable' },
        { status: 400 }
      );
    }
    
    // Microsoft OAuth can be used with the provider parameter
    // According to WorkOS docs, MicrosoftOAuth is a supported provider value
    // This works with OAuth connections configured at the environment level
    const authorizationUrl = workos.sso.getAuthorizationUrl({
      provider: 'MicrosoftOAuth',
      redirectUri,
      clientId,
    });
    
    return NextResponse.json({ url: authorizationUrl });
  } catch (error: any) {
    console.error('Microsoft SSO authorization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate authorization URL',
        details: error.message,
        hint: 'Microsoft OAuth requires configuration in WorkOS Dashboard. ' +
              'Go to: WorkOS Dashboard → SSO → Connections → Create Connection → Microsoft OAuth. ' +
              'Configure the connection with your Azure AD credentials, or use WorkOS demo/test credentials for testing.'
      },
      { status: 500 }
    );
  }
}

