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
    
    // Microsoft SSO requires a connection to be created in WorkOS Dashboard
    // Option 1: Use connection ID (if you have a specific Microsoft connection)
    const connectionId = process.env.WORKOS_MICROSOFT_CONNECTION_ID;
    
    // Option 2: Use organization ID (if you have an organization with Microsoft connection)
    const organizationId = process.env.WORKOS_ORGANIZATION_ID;
    
    let authorizationUrl: string;
    
    if (connectionId) {
      // Use specific connection ID
      authorizationUrl = workos.sso.getAuthorizationUrl({
        connection: connectionId,
        redirectUri,
        clientId,
      });
    } else if (organizationId) {
      // Use organization ID (connects to the organization's SSO connection)
      authorizationUrl = workos.sso.getAuthorizationUrl({
        organization: organizationId,
        redirectUri,
        clientId,
      });
    } else {
      // Demo/Development mode: Allow testing without full connection setup
      // In development, try to use a connection selector if available
      // This allows users to select their connection from WorkOS
      try {
        // Try with connection selector (allows users to choose their Microsoft connection)
        // This works if you have at least one Microsoft connection in WorkOS, even if not fully configured
        authorizationUrl = workos.sso.getAuthorizationUrl({
          // Using connection selector - WorkOS will show available connections
          // This requires at least one connection to exist in the WorkOS account
          redirectUri,
          clientId,
        });
      } catch (selectorError: any) {
        // If connection selector fails, provide helpful error with setup instructions
        throw new Error(
          'Microsoft SSO requires either WORKOS_MICROSOFT_CONNECTION_ID or WORKOS_ORGANIZATION_ID to be set. ' +
          'Please create a Microsoft Entra ID (Azure AD) connection in WorkOS Dashboard first. ' +
          'Go to: WorkOS Dashboard → SSO → Connections → Create Connection → Microsoft Entra ID (Azure AD). ' +
          'After creating the connection, set WORKOS_MICROSOFT_CONNECTION_ID in your environment variables.'
        );
      }
    }
    
    return NextResponse.json({ url: authorizationUrl });
  } catch (error: any) {
    console.error('Microsoft SSO authorization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate authorization URL',
        details: error.message,
        hint: 'Microsoft SSO requires a connection to be configured in WorkOS Dashboard. ' +
              'Go to: WorkOS Dashboard → SSO → Connections → Create Connection → Microsoft Entra ID (Azure AD). ' +
              'After creating the connection, set WORKOS_MICROSOFT_CONNECTION_ID in your environment variables.'
      },
      { status: 500 }
    );
  }
}

