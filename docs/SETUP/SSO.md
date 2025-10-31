# SSO Configuration Guide

**Last Updated**: 2025-01-30

---

## Overview

This guide explains how to configure Single Sign-On (SSO) providers in DocHub using WorkOS. DocHub supports multiple SSO providers through WorkOS's provider-agnostic system.

---

## Supported Providers

- **Microsoft Azure AD**
- **Google Workspace**
- **Okta**
- **Generic SAML 2.0**
- **Generic OIDC**
- **Custom Providers**

---

## Prerequisites

1. **WorkOS Setup**: Complete [WorkOS Setup](WORKOS.md) first
2. **Provider Account**: Access to your SSO provider (Azure AD, Google, Okta, etc.)
3. **WorkOS Dashboard Access**: Admin access to WorkOS Dashboard

---

## General Setup Process

### Step 1: Configure Provider

1. Log in to your SSO provider's admin console
2. Create or configure an application/connection:
   - **Redirect URI**: `https://dashboard.workos.com/sso/callback`
   - Note down: Client ID, Client Secret, Domain/Tenant

### Step 2: Configure in WorkOS

1. Log in to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **SSO** → **Connections**
3. Click **Create Connection**
4. Select your provider type
5. Enter credentials:
   - Client ID
   - Client Secret
   - Domain/Tenant ID (if applicable)
6. Configure additional settings as needed

### Step 3: Link Organizations

1. In WorkOS Dashboard, go to your SSO connection
2. Link organizations to the connection
3. Users in linked organizations will use SSO

### Step 4: Test

1. Sign out from DocHub
2. Sign in again
3. Verify SSO option appears
4. Test authentication flow

---

## Provider-Specific Configuration

### Microsoft Azure AD

**In Azure Portal**:
1. Go to **Azure Active Directory** → **App registrations**
2. Create new registration or use existing
3. Configure:
   - **Redirect URI**: `https://dashboard.workos.com/sso/callback`
   - **Supported account types**: As needed
4. Create **Client Secret**
5. Note: **Application (Client) ID** and **Directory (Tenant) ID**

**In WorkOS Dashboard**:
1. Create **Microsoft** SSO connection
2. Enter:
   - **Client ID**: Application (Client) ID
   - **Client Secret**: Client Secret from Azure
   - **Tenant ID**: Directory (Tenant) ID

### Google Workspace

**In Google Cloud Console**:
1. Create new project or select existing
2. Go to **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID**
4. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://dashboard.workos.com/sso/callback`
5. Note: **Client ID** and **Client Secret**

**In WorkOS Dashboard**:
1. Create **Google** SSO connection
2. Enter:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### Okta

**In Okta Admin Console**:
1. Go to **Applications** → **Applications**
2. Create new application or use existing
3. Choose **OIDC - OpenID Connect** or **SAML 2.0**
4. Configure:
   - **Redirect URIs**: `https://dashboard.workos.com/sso/callback`
   - **Login redirect URIs**: Same as above
5. Note: **Client ID** and **Client Secret**
6. Note: **Okta Domain** (e.g., `dev-123456.okta.com`)

**In WorkOS Dashboard**:
1. Create **Okta** SSO connection
2. Enter:
   - **Client ID**: From Okta
   - **Client Secret**: From Okta
   - **Domain**: Your Okta domain

---

## Testing SSO

### Test Checklist

1. **Sign-In Flow**:
   - [ ] SSO button appears on sign-in page
   - [ ] Clicking SSO redirects to provider
   - [ ] Authentication completes successfully
   - [ ] User is redirected back to DocHub

2. **User Experience**:
   - [ ] User sees correct organization
   - [ ] Teams sync correctly
   - [ ] Document access works
   - [ ] Admin access works (if applicable)

3. **Error Handling**:
   - [ ] Invalid credentials show error
   - [ ] Canceled auth shows appropriate message
   - [ ] Network errors handled gracefully

---

## Troubleshooting

### SSO Button Not Appearing

- **Check**: SSO connection is active in WorkOS Dashboard
- **Check**: Organizations are linked to connection
- **Check**: Connection is properly configured

### Authentication Fails

- **Check**: Redirect URI matches in both provider and WorkOS
- **Check**: Client credentials are correct
- **Check**: Provider application is active
- **Check**: User has access to provider

### Organizations Not Syncing

- **Check**: `WORKOS_USE_ORGANIZATIONS=true` in `.env`
- **Check**: Users are in correct organizations in WorkOS
- **Check**: API key has Organizations permissions

---

## Related Documentation

- [WorkOS Setup](WORKOS.md)
- [Provider Migration](PROVIDER_MIGRATION.md)
- [Authentication Features](../FEATURES/AUTHENTICATION.md)

