import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/workos/server';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create new user in WorkOS
    // Note: This user can be added to organizations (same as SSO users)
    // Organization membership is managed separately via WorkOS Dashboard or API
    const user = await workos.userManagement.createUser({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      emailVerified: false, // Will need email verification
    });

    // Optional: If WORKOS_ORGANIZATION_ID is set, automatically add user to organization
    // This allows email/password users to be in the same organization as SSO users
    const organizationId = process.env.WORKOS_ORGANIZATION_ID;
    if (organizationId) {
      try {
        await workos.userManagement.createOrganizationMembership({
          userId: user.id,
          organizationId: organizationId,
        });
        log.info(`✅ Added new user ${user.id} to organization ${organizationId}`);
      } catch (orgError: any) {
        // Log but don't fail - user can be added to org later via Dashboard
        log.warn(`Could not auto-add user to organization: ${orgError.message}`);
      }
    }

    // Try to authenticate the newly created user
    // Note: If email verification is required, this will fail
    try {
      const { accessToken, refreshToken } = await workos.userManagement.authenticateWithPassword({
        email,
        password,
        clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
      });

      // If authentication succeeds, set session cookies
      const response = NextResponse.json({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
        }
      });

      // Set session cookies
      response.cookies.set('wos-session', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours (changed from 7 days)
        path: '/',
      });

      if (refreshToken) {
        response.cookies.set('wos-refresh-token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });
      }

      return response;
    } catch (authError: any) {
      // If email verification is required, return verification info
      if (authError.status === 403 && authError.rawData?.code === 'email_verification_required') {
        return NextResponse.json({
          success: true,
          requiresEmailVerification: true,
          email: user.email,
          pendingAuthenticationToken: authError.rawData.pending_authentication_token,
          emailVerificationId: authError.rawData.email_verification_id,
          message: 'Please check your email to verify your account before signing in.',
        }, { status: 200 });
      }
      
      // Re-throw if it's a different error
      throw authError;
    }
  } catch (error: any) {
    log.error('Sign up error:', error);
    
    // Handle WorkOS errors
    if (error.rawData?.code === 'user_email_already_exists' || 
        error.message?.includes('already exists') || 
        error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    if (error.rawData?.code === 'password_validation_failed' ||
        error.message?.includes('password')) {
      return NextResponse.json(
        { error: 'Password does not meet requirements' },
        { status: 400 }
      );
    }

    // If it's an email verification error that we didn't catch above, handle it
    if (error.status === 403 && error.rawData?.code === 'email_verification_required') {
      return NextResponse.json({
        success: true,
        requiresEmailVerification: true,
        email: error.rawData.email,
        pendingAuthenticationToken: error.rawData.pending_authentication_token,
        emailVerificationId: error.rawData.email_verification_id,
        message: 'Please check your email to verify your account before signing in.',
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Failed to create account', details: error.message },
      { status: 500 }
    );
  }
}

