import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';
import { log } from '@/lib/logger';

/**
 * Generic SSO authorization endpoint
 * Works with any SSO provider configured in WorkOS
 * 
 * Priority order for configuration:
 * 1. WORKOS_SSO_CONNECTION_ID - Use specific connection
 * 2. WORKOS_ORGANIZATION_ID - Use organization's configured connection (recommended)
 * 
 * To switch providers: Just update your organization's connection in WorkOS Dashboard
 * No code changes needed!
 */
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
    
    // Check configuration options (priority order):
    // 1. Connection ID (specific SSO connection)
    // 2. Organization ID (organization's SSO connection - RECOMMENDED)
    //    The organization's connection can be updated in WorkOS Dashboard without code changes
    const connectionId = process.env.WORKOS_SSO_CONNECTION_ID;
    const organizationId = process.env.WORKOS_ORGANIZATION_ID;
    
    let authorizationUrl: string;
    let configMethod: string;
    
    if (connectionId) {
      // Use specific connection ID
      authorizationUrl = workos.sso.getAuthorizationUrl({
        connection: connectionId,
        redirectUri,
        clientId,
      });
      configMethod = 'connection ID';
    } else if (organizationId) {
      // Use organization ID (RECOMMENDED)
      // This uses whatever SSO connection is configured for the organization
      // To switch providers: Update the organization's connection in WorkOS Dashboard
      authorizationUrl = workos.sso.getAuthorizationUrl({
        organization: organizationId,
        redirectUri,
        clientId,
      });
      configMethod = 'organization ID';
    } else {
      return NextResponse.json(
        {
          error: 'Missing SSO configuration',
          details: 'Either WORKOS_SSO_CONNECTION_ID or WORKOS_ORGANIZATION_ID must be set',
          hint: 'Set WORKOS_ORGANIZATION_ID in your environment variables. ' +
                'Then configure the organization\'s SSO connection in WorkOS Dashboard.',
          setupRequired: true,
          dashboardUrl: 'https://dashboard.workos.com/organizations',
        },
        { status: 400 }
      );
    }
    
    log.debug(`SSO authorization using: ${configMethod}`);
    if (organizationId && !connectionId) {
      log.debug(`✅ Using organization ID (${organizationId}). To switch providers, update the organization's connection in WorkOS Dashboard.`);
    }
    
    return NextResponse.json({ url: authorizationUrl });
  } catch (error: any) {
    log.error('SSO authorization error:', error);
    log.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });
    
    // Provide helpful error message
    let hint = 'SSO requires configuration in WorkOS Dashboard. ';
    
    if (error.message?.includes('connection') || error.message?.includes('Connection')) {
      hint += 'Ensure your organization has an SSO connection configured. ';
      hint += 'Go to: WorkOS Dashboard → Organizations → Your Organization → Connections. ';
      hint += 'Update or create the connection for your desired SSO provider.';
    } else if (error.message?.includes('organization') || error.message?.includes('Organization')) {
      hint += 'Check that WORKOS_ORGANIZATION_ID is correct and the organization exists. ';
      hint += 'Go to: WorkOS Dashboard → Organizations to verify.';
    } else {
      hint += 'Verify your organization is configured with an SSO connection. ';
      hint += 'Go to: WorkOS Dashboard → Organizations → Your Organization → Connections.';
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate authorization URL',
        details: error.message,
        hint,
        setupRequired: true,
        dashboardUrl: 'https://dashboard.workos.com/organizations',
      },
      { status: 500 }
    );
  }
}

