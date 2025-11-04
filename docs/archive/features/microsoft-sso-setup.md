# Microsoft SSO Setup Guide

**Last Updated**: 2025-01-30  
**Status**: Implementation Complete, Needs WorkOS Dashboard Configuration

---

## Overview

DocHub is configured to use **Microsoft SSO (Single Sign-On) only** for authentication. Users sign in with their Microsoft account, and accounts are automatically created on first sign-in (JIT provisioning).

---

## Current Implementation

### Authentication Flow

1. **User visits sign-in page** (`/auth/signin`)
2. **Clicks "Continue with Microsoft" button**
3. **Redirected to Microsoft** for authentication
4. **Microsoft redirects back** to `/auth/callback` with authorization code
5. **WorkOS exchanges code** for user session
6. **User is authenticated** and redirected to home page

### Files Modified

- ✅ `app/auth/signin/page.tsx` - Microsoft SSO button only, removed email/password form
- ✅ `app/auth/signup/page.tsx` - Redirects to sign-in (SSO doesn't need separate sign-up)
- ✅ `app/auth/callback/route.ts` - Handles OAuth callback (already implemented)

### Removed Features

- ❌ Email/password authentication
- ❌ Email verification codes
- ❌ Google OAuth
- ❌ GitHub OAuth
- ❌ Sign-up form

---

## WorkOS Dashboard Configuration

### Step 1: Create Microsoft SSO Connection

**Important**: Microsoft SSO uses WorkOS SSO Connections, NOT Social Providers.

#### Quick Demo Setup (For Testing)

If you want to test quickly without full Azure AD setup:

1. Log in to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **SSO** → **Connections**
3. Click **Create Connection**
4. Select **Microsoft Entra ID (Azure AD)** as the connection type
5. For demo/testing, you can use minimal configuration:
   - Connection name: "Demo Microsoft Connection"
   - You can skip full Azure AD configuration initially (WorkOS may provide test credentials)
6. **Copy the Connection ID** after creation - you'll need this for environment variables

**Note**: For full production setup, you'll need to complete the Azure AD app registration steps below.

#### Full Production Setup

1. Follow the Quick Demo Setup steps above
2. Complete the Azure AD configuration as described in Step 2
3. Configure the connection with your Azure AD credentials

### Step 2: Configure Microsoft Azure AD App

You need to create a Microsoft Azure AD application registration:

#### Option A: Azure AD (Enterprise/Organizational Accounts)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: DocHub (or your app name)
   - **Supported account types**: 
     - "Accounts in any organizational directory" for enterprise only
     - "Accounts in any organizational directory and personal Microsoft accounts" for both
   - **Redirect URI**: 
     - Type: Web
     - URI: `http://localhost:3000/auth/callback` (for development)
     - Add production URI: `https://yourdomain.com/auth/callback`
5. Click **Register**
6. After registration:
   - **Copy the Application (client) ID** - This is your OAuth Client ID
   - Go to **Certificates & secrets**
   - Create a **New client secret**
   - **Copy the secret value** immediately (you won't see it again) - This is your OAuth Secret

#### Option B: Microsoft Personal Accounts (Consumer)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: DocHub
   - **Supported account types**: "Personal Microsoft accounts only"
   - **Redirect URI**: Same as above
5. Follow same steps for Client ID and Secret

### Step 3: Add Credentials to WorkOS

1. In WorkOS Dashboard → **Microsoft Provider** settings
2. Enter:
   - **Client ID**: From Azure AD (Application ID)
   - **Client Secret**: From Azure AD (Secret value)
3. **Redirect URI**: `http://localhost:3000/auth/callback` (dev) and production URL
4. Click **Save** or **Enable**

### Step 4: Configure API Permissions (If Needed)

If you need additional Microsoft Graph API permissions:

1. In Azure AD app registration
2. Go to **API permissions**
3. Click **Add a permission**
4. Select **Microsoft Graph**
5. Choose required permissions:
   - **User.Read** (usually included by default)
   - Add more as needed (e.g., User.ReadBasic.All, Mail.Read, etc.)
6. Click **Add permissions**
7. **Grant admin consent** if required

---

## Environment Variables

Make sure these are set in `.env.local`:

```env
# WorkOS Configuration
WORKOS_API_KEY=sk_test_your_workos_api_key
WORKOS_CLIENT_ID=client_your_workos_client_id
NEXT_PUBLIC_WORKOS_CLIENT_ID=client_your_workos_client_id
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_COOKIE_PASSWORD=your_random_32_char_string

# Microsoft SSO Connection (REQUIRED for company/enterprise accounts)
# Get this from WorkOS Dashboard → SSO → Connections → Your Microsoft Connection → Connection ID
# The connection ID starts with "conn_"
# REQUIRED if you want to authenticate with company/enterprise Microsoft accounts
WORKOS_MICROSOFT_CONNECTION_ID=conn_xxxxxxxxxxxxx

# Alternative: Use Organization ID if you have an organization with Microsoft connection
# WORKOS_ORGANIZATION_ID=org_xxxxxxxxxxxxx

# Note: If neither is set, the code will try to use provider: 'MicrosoftOAuth'
# This may work for personal accounts but is NOT recommended for company accounts
```

---

## Testing

### Development Testing

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`
3. Click **Continue with Microsoft**
4. You should be redirected to Microsoft login
5. Sign in with a Microsoft account
6. You should be redirected back to DocHub and authenticated

### Production Testing

1. Update redirect URI in Azure AD to production URL
2. Update `NEXT_PUBLIC_WORKOS_REDIRECT_URI` in production environment
3. Test the same flow on production domain

---

## Troubleshooting

### Error: "Invalid redirect URI"
- **Cause**: Redirect URI in WorkOS doesn't match Azure AD configuration
- **Fix**: Ensure redirect URIs match exactly in both places

### Error: "Client ID not found"
- **Cause**: Microsoft Client ID not configured in WorkOS
- **Fix**: Add Microsoft Client ID to WorkOS Dashboard

### Error: "Invalid client secret"
- **Cause**: Microsoft Client Secret expired or incorrect
- **Fix**: Generate new secret in Azure AD and update in WorkOS

### Users can't sign in
- **Cause**: Microsoft app not configured for the right account types
- **Fix**: Check Azure AD app registration → Supported account types

### Account creation issues
- **Cause**: JIT provisioning may be disabled
- **Fix**: Check WorkOS settings to ensure automatic user creation is enabled

---

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS in production for OAuth redirects
2. **Client Secret**: Never commit client secrets to version control
3. **Redirect URI Validation**: Ensure redirect URIs are validated to prevent attacks
4. **Session Security**: HTTP-only cookies are used for session management
5. **Token Expiration**: WorkOS handles token refresh automatically

---

## Next Steps

- ✅ Microsoft SSO implementation complete
- [ ] Configure Microsoft OAuth in WorkOS Dashboard
- [ ] Test authentication flow end-to-end
- [ ] Set up production redirect URIs
- [ ] Configure domain whitelisting if needed

---

## References

- [WorkOS Microsoft SSO Documentation](https://workos.com/docs/authkit/social-login/microsoft)
- [Azure AD App Registration](https://portal.azure.com)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

