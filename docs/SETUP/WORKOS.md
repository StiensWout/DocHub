# WorkOS Setup Guide

---

## Overview

This guide walks you through setting up WorkOS for authentication in DocHub. WorkOS provides a provider-agnostic SSO system that supports multiple authentication methods.

---

## Prerequisites

1. **WorkOS Account**: Sign up at [workos.com](https://workos.com)
2. **WorkOS Project**: Create a new project in WorkOS Dashboard
3. **Environment Access**: Access to your `.env` file

---

## Step 1: Get WorkOS Credentials

1. Log in to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **API Keys** section
3. Create a new API key or use existing one
4. Copy the following:
   - **API Key**: `sk_...` (starts with `sk_`)
   - **Client ID**: `client_...` (starts with `client_`)

---

## Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# WorkOS Configuration
WORKOS_API_KEY=sk_your_api_key_here
WORKOS_CLIENT_ID=client_your_client_id_here
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback

# WorkOS Organizations (Recommended)
WORKOS_USE_ORGANIZATIONS=true

# Admin Organization (Optional)
WORKOS_ADMIN_ORGANIZATION_NAME=admin
```

**Production**:
```bash
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://yourdomain.com/auth/callback
```

---

## Step 3: Configure Redirect URI

1. In WorkOS Dashboard, go to **Configuration** → **Redirect URIs**
2. Add your redirect URI:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

---

## Step 4: Set Up Organizations (Recommended)

### Option A: Using WorkOS Dashboard

1. Navigate to **Organizations** in WorkOS Dashboard
2. Create organizations (e.g., "Engineering", "Sales")
3. Add users to organizations
4. Assign roles to users within organizations

### Option B: Using WorkOS API

Use the WorkOS API to create organizations programmatically.

---

## Step 5: Configure Admin Access

### Method 1: Admin Organization (Recommended)

1. Create an organization named "admin" (or use `WORKOS_ADMIN_ORGANIZATION_NAME`)
2. Add admin users to this organization
3. Users in this organization will have admin privileges

### Method 2: Admin Role

1. In any organization, assign users the role "admin"
2. Users with "admin" role will have admin privileges

See [Admin Setup](../ADMIN_SETUP.md) for details.

---

## Step 6: Configure SSO Provider (Optional)

To enable SSO:

1. Navigate to **SSO** in WorkOS Dashboard
2. Create a new SSO connection
3. Configure your provider (Microsoft, Google, Okta, etc.)
4. Link the connection to your organizations
5. Users will see SSO option on sign-in page

**Note**: SSO can be configured later - email/password works immediately.

---

## Step 7: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/auth/signin`
3. Test email/password authentication
4. If SSO configured, test SSO authentication

---

## Configuration Options

### WorkOS Organizations

```bash
WORKOS_USE_ORGANIZATIONS=true
```

**Benefits**:
- Teams synced from WorkOS Organizations
- Automatic team creation
- Real-time membership updates

### Admin Organization

```bash
WORKOS_ADMIN_ORGANIZATION_NAME=admin
```

Default: `admin`. Users in this organization have admin privileges.

---

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**
   - Check API key is correct
   - Verify API key has required permissions

2. **Redirect URI mismatch**
   - Ensure redirect URI in `.env` matches WorkOS Dashboard
   - Check for trailing slashes

3. **Organizations not syncing**
   - Verify `WORKOS_USE_ORGANIZATIONS=true`
   - Check API key has Organizations permissions

4. **SSO not working**
   - Verify SSO connection is configured
   - Check provider credentials
   - Ensure connection is linked to organizations

See [Troubleshooting](../TROUBLESHOOTING.md) for more help.

---

## Next Steps

- [SSO Configuration](SSO.md) - Set up Single Sign-On
- [Provider Migration](PROVIDER_MIGRATION.md) - Switch SSO providers
- [Admin Setup](../ADMIN_SETUP.md) - Configure admin access

---

## Related Documentation

- [Authentication & Authorization](https://github.com/StiensWout/DocHub/issues) - See GitHub Issues for feature details
- [Teams & Organizations](https://github.com/StiensWout/DocHub/issues) - See GitHub Issues for feature details
- [Admin Setup](../ADMIN_SETUP.md)

