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
    
    // Check if a specific connection ID is provided (preferred for company accounts)
    const connectionId = process.env.WORKOS_MICROSOFT_CONNECTION_ID;
    const organizationId = process.env.WORKOS_ORGANIZATION_ID;
    
    let authorizationUrl: string;
    
    if (connectionId) {
      // Use specific connection ID (recommended for company/enterprise accounts)
      // This allows you to configure specific Azure AD tenants
      authorizationUrl = workos.sso.getAuthorizationUrl({
        connection: connectionId,
        redirectUri,
        clientId,
      });
    } else if (organizationId) {
      // Use organization ID
      authorizationUrl = workos.sso.getAuthorizationUrl({
        organization: organizationId,
        redirectUri,
        clientId,
      });
    } else {
      // Use provider parameter (works with environment-level OAuth config)
      // Note: This requires Microsoft OAuth to be configured in WorkOS Dashboard
      // May not work with company accounts if not properly configured
      authorizationUrl = workos.sso.getAuthorizationUrl({
        provider: 'MicrosoftOAuth',
        redirectUri,
        clientId,
      });
    }
    
    return NextResponse.json({ url: authorizationUrl });
  } catch (error: any) {
    console.error('Microsoft SSO authorization error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });
    
    // Provide specific guidance based on error type
    let hint = 'Microsoft OAuth requires configuration in WorkOS Dashboard. ';
    
    if (error.message?.includes('connection') || error.message?.includes('Connection')) {
      hint += 'You need to create a Microsoft OAuth connection in WorkOS Dashboard first. ';
      hint += 'Go to: WorkOS Dashboard → SSO → Connections → Create Connection → Microsoft OAuth. ';
      hint += 'For company accounts, you must configure the connection with your Azure AD tenant credentials. ';
      hint += 'Then set WORKOS_MICROSOFT_CONNECTION_ID in your environment variables.';
    } else {
      hint += 'Go to: WorkOS Dashboard → SSO → Connections → Create Connection → Microsoft OAuth. ';
      hint += 'Configure the connection with your Azure AD credentials. ';
      hint += 'For company accounts, you MUST create a connection and set WORKOS_MICROSOFT_CONNECTION_ID.';
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate authorization URL',
        details: error.message,
        hint,
        setupRequired: true,
        dashboardUrl: 'https://dashboard.workos.com/connections',
      },
      { status: 500 }
    );
  }
}

