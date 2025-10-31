# WorkOS AuthKit Setup Guide

## Environment Variables Required

Based on current WorkOS AuthKit documentation, you need the following environment variables:

### Required Variables

```env
# Server-side API Key (SECRET - never expose to client)
# Found in: WorkOS Dashboard → API Keys → API Key (starts with sk_)
WORKOS_API_KEY=sk_test_...

# Public Client ID (safe to expose to frontend)
# Found in: WorkOS Dashboard → API Keys → Client ID (starts with client_)
WORKOS_CLIENT_ID=client_...
NEXT_PUBLIC_WORKOS_CLIENT_ID=client_...  # Same value as above

# Redirect URI for OAuth callbacks
# Must match URLs configured in WorkOS Dashboard → Redirects
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback

# Cookie password for session encryption
# Generate a random 32+ character string (never commit this)
WORKOS_COOKIE_PASSWORD=your_random_32_char_string_here
```

## How to Get Your Keys

1. **Log in to WorkOS Dashboard**: https://dashboard.workos.com
2. **Navigate to API Keys**: In the left sidebar, go to **API Keys**
3. **Copy the values**:
   - **API Key** (starts with `sk_`) → This is your `WORKOS_API_KEY`
   - **Client ID** (starts with `client_`) → This is your `WORKOS_CLIENT_ID`

## Important Notes

- ✅ **There is NO separate "public API key"** - only Client ID (public) and API Key (secret)
- ✅ The Client ID is safe to expose in frontend code (that's why it's public)
- ✅ The API Key must NEVER be exposed to the client (server-side only)
- ✅ Always use the same Client ID value for both `WORKOS_CLIENT_ID` and `NEXT_PUBLIC_WORKOS_CLIENT_ID`

## Setting Up Redirect URIs

1. In WorkOS Dashboard, go to **Redirects**
2. Add your callback URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

## Verifying Your Setup

After adding the keys to `.env.local`, verify they're loaded correctly:

```bash
# Check that variables are set (will show values)
echo $WORKOS_API_KEY
echo $WORKOS_CLIENT_ID
```

**Note**: Make sure `.env.local` is in your `.gitignore` (it should be) to prevent committing secrets.

## Troubleshooting

### "Missing WorkOS environment variables" error
- Verify `.env.local` exists in the project root
- Check that variable names match exactly (case-sensitive)
- Restart your development server after adding variables

### "Invalid Client ID" error
- Verify the Client ID starts with `client_`
- Ensure you're using the Client ID from the correct WorkOS environment (dev vs prod)
- Check for extra spaces or characters when copying

### "Invalid API Key" error
- Verify the API Key starts with `sk_`
- Ensure you're using the API Key from the correct WorkOS environment
- Check for extra spaces or characters when copying

---

**Last Updated**: 2025-01-30  
**WorkOS Documentation**: https://workos.com/docs/authkit

