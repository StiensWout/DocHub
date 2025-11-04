# SSO Provider Migration Guide

---

## Overview

DocHub uses a provider-agnostic SSO system built on WorkOS. This means you can switch SSO providers without any code changes - just update the configuration in WorkOS Dashboard.

---

## How It Works

DocHub's SSO implementation is **completely provider-agnostic**:

1. **Generic SSO Endpoint**: `/api/auth/sso` works with any provider
2. **WorkOS Abstraction**: WorkOS handles provider-specific details
3. **No Code Changes**: Switch providers by updating WorkOS Dashboard only

---

## Migration Steps

### Step 1: Set Up New Provider in WorkOS

1. Log in to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **SSO** → **Connections**
3. Create a new SSO connection for your new provider:
   - Microsoft Azure AD
   - Google Workspace
   - Okta
   - Generic SAML/OIDC
   - Custom provider

4. Follow provider-specific setup instructions
5. Configure required credentials:
   - Client ID / Application ID
   - Client Secret
   - Domain / Tenant ID
   - Redirect URIs

### Step 2: Link Organizations

1. In WorkOS Dashboard, go to your new SSO connection
2. Link organizations to the connection
3. Users in linked organizations will use the new provider

### Step 3: Test the Migration

1. Sign out from DocHub
2. Sign in again
3. You should see the new provider's SSO option
4. Test authentication flow

### Step 4: Remove Old Provider (Optional)

1. After confirming new provider works:
   - Unlink organizations from old connection
   - Optionally delete old connection

---

## Provider-Specific Guides

### Microsoft Azure AD

1. **In Azure Portal**:
   - Register an application
   - Configure redirect URIs
   - Create client secret
   - Note Application (Client) ID and Directory (Tenant) ID

2. **In WorkOS Dashboard**:
   - Create Microsoft SSO connection
   - Enter Client ID and Client Secret
   - Enter Tenant ID
   - Configure permissions

### Google Workspace

1. **In Google Cloud Console**:
   - Create OAuth 2.0 credentials
   - Configure authorized redirect URIs
   - Note Client ID and Client Secret

2. **In WorkOS Dashboard**:
   - Create Google SSO connection
   - Enter Client ID and Client Secret
   - Configure domain

### Okta

1. **In Okta Admin**:
   - Create an application
   - Configure redirect URIs
   - Note Client ID and Client Secret

2. **In WorkOS Dashboard**:
   - Create Okta SSO connection
   - Enter Client ID and Client Secret
   - Enter Okta domain

---

## Migration Strategy

### Option 1: Phased Migration (Recommended)

1. **Phase 1**: Set up new provider alongside old one
2. **Phase 2**: Link test organizations to new provider
3. **Phase 3**: Test with test users
4. **Phase 4**: Migrate all organizations
5. **Phase 5**: Remove old provider

### Option 2: Immediate Switch

1. Set up new provider
2. Migrate all organizations at once
3. Remove old provider

**Risk**: Higher risk, but faster migration

---

## Rollback Plan

If issues arise:

1. **Quick Rollback**:
   - Link organizations back to old provider in WorkOS Dashboard
   - No code changes needed

2. **User Impact**:
   - Users may need to re-authenticate
   - Sessions remain valid until they expire

---

## Testing Checklist

Before completing migration:

- [ ] Test sign-in with new provider
- [ ] Verify user sessions work
- [ ] Confirm organization memberships sync
- [ ] Test team access and document visibility
- [ ] Verify admin access works
- [ ] Test with multiple users
- [ ] Check error handling

---

## Common Issues

### Users Can't Sign In

- **Check**: Provider credentials in WorkOS Dashboard
- **Check**: Redirect URI matches WorkOS configuration
- **Check**: Organization is linked to SSO connection

### Organizations Not Syncing

- **Check**: `WORKOS_USE_ORGANIZATIONS=true` in `.env`
- **Check**: API key has Organizations permissions
- **Check**: Users are in correct organizations

### Authentication Errors

- **Check**: Provider-specific configuration
- **Check**: WorkOS Dashboard connection status
- **Check**: User permissions in provider

---

## Related Documentation

- [WorkOS Setup](WORKOS.md)
- [SSO Configuration](SSO.md)
- [Authentication & Authorization](https://github.com/StiensWout/DocHub/issues) - See GitHub Issues for feature details

