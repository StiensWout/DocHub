# Switching Authentication Providers

The authentication system is designed to be **provider-agnostic**. You can switch between different SSO providers (Microsoft, Google, Okta, etc.) without any code changes - just configuration updates.

## How It Works

The system uses **WorkOS Organizations** to abstract away the SSO provider. Your application authenticates through your WorkOS organization, and WorkOS handles the connection to whatever SSO provider you configure.

### Architecture

```
Your App → WorkOS Organization → SSO Provider (Microsoft/Google/Okta/etc.)
```

**Key Benefit**: To switch providers, you only need to update the organization's connection in WorkOS Dashboard. No code changes required!

## Current Setup

- **Organization ID**: Set in `.env.local` as `WORKOS_ORGANIZATION_ID`
- **SSO Connection**: Configured in WorkOS Dashboard for your organization
- **Provider**: Determined by the connection configured in WorkOS (can be changed anytime)

## Switching Providers

### Step 1: Configure New Provider in WorkOS Dashboard

1. Log in to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **Organizations** → Select your organization
3. Go to **Connections** tab
4. Either:
   - **Update existing connection**: Change the current connection to your new provider
   - **Add new connection**: Create a new connection for the new provider and set it as primary

### Step 2: (Optional) Update UI Text

If you want to customize the sign-in page text, you can set these environment variables:

```env
# Optional: Customize sign-in page text
NEXT_PUBLIC_SSO_PROVIDER_NAME="Microsoft"  # Used in "Sign in with Microsoft"
NEXT_PUBLIC_SSO_PROVIDER_BUTTON_TEXT="Continue with Microsoft"
NEXT_PUBLIC_SSO_PROVIDER_DESCRIPTION="Sign in with your Microsoft account"
```

**Note**: If you don't set these, the page will use generic text that works for any provider.

### Step 3: Restart Dev Server

After updating the connection in WorkOS Dashboard, restart your dev server:

```bash
bun run dev
```

That's it! No code changes needed.

## Supported Providers

The system works with any SSO provider that WorkOS supports:

- **Microsoft Entra ID (Azure AD)**
- **Google Workspace**
- **Okta**
- **OneLogin**
- **Auth0**
- **Generic SAML 2.0**
- **Generic OIDC**
- And many more...

## Environment Variables

### Required

```env
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
NEXT_PUBLIC_WORKOS_CLIENT_ID=client_...
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_ORGANIZATION_ID=org_...  # Your organization ID
```

### Optional (for UI customization)

```env
# Customize sign-in page text
NEXT_PUBLIC_SSO_PROVIDER_NAME="Your Provider Name"
NEXT_PUBLIC_SSO_PROVIDER_BUTTON_TEXT="Continue with Your Provider"
NEXT_PUBLIC_SSO_PROVIDER_DESCRIPTION="Sign in with your organization account"

# Alternative: Use specific connection instead of organization
WORKOS_SSO_CONNECTION_ID=conn_...  # If you want to use a specific connection
```

## Priority Order

The system checks configuration in this order:

1. **`WORKOS_SSO_CONNECTION_ID`** - Use specific connection (if set)
2. **`WORKOS_ORGANIZATION_ID`** - Use organization's connection (recommended)
3. If neither is set, returns an error

**Recommendation**: Use `WORKOS_ORGANIZATION_ID` for maximum flexibility. You can switch providers by just updating the organization's connection in WorkOS Dashboard.

## Example: Switching from Test SSO to Microsoft

1. **Current setup**: Organization uses Test SSO provider
2. **Update in WorkOS Dashboard**:
   - Go to Organizations → Your Org → Connections
   - Create or update connection to Microsoft Entra ID (Azure AD)
   - Configure with your Azure AD credentials
3. **Restart dev server**
4. **Done!** The login now uses Microsoft instead of test SSO

No code changes needed! The system automatically uses whatever connection is configured for your organization.

## Troubleshooting

### "Missing SSO configuration" error

- Ensure `WORKOS_ORGANIZATION_ID` or `WORKOS_SSO_CONNECTION_ID` is set in `.env.local`
- Verify the organization exists in WorkOS Dashboard
- Check that the organization has a connection configured

### Authentication fails

- Verify the connection is properly configured in WorkOS Dashboard
- Check that redirect URIs match in both WorkOS and the provider
- Ensure provider credentials are correct
- Check browser console and server logs for specific errors

### Provider-specific issues

Each provider has different setup requirements. See:
- `docs/FEATURES/pending/microsoft-sso-setup.md` for Microsoft
- WorkOS Dashboard documentation for other providers

## Benefits of This Architecture

✅ **No code changes** when switching providers  
✅ **Consistent API** regardless of provider  
✅ **Easy testing** - switch between test and production providers  
✅ **Future-proof** - add new providers without code updates  
✅ **Flexibility** - use organization or specific connection-based routing
