# Troubleshooting Guide

Common issues and solutions for DocHub.

## SSO Authentication Issues

If you're having trouble with SSO authentication, here are common causes and solutions:

### 1. Check Environment Variables

The most common cause is missing or incorrect environment variables.

**Check your `.env.local` file has:**

```env
WORKOS_API_KEY=sk_your_workos_api_key
WORKOS_CLIENT_ID=client_your_workos_client_id
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_USE_ORGANIZATIONS=true
```

**Verify they're loaded:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for logs that show environment variable status
4. If you see "Missing NEXT_PUBLIC_WORKOS_CLIENT_ID" or similar, the variable isn't set

**Fix:**

- Restart your development server after adding/changing environment variables
- Make sure `.env.local` is in the root directory (same level as `package.json`)
- Variables starting with `NEXT_PUBLIC_` are required for client-side code

### 2. Check Browser Console

When you click the login button:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - `Redirecting to WorkOS:` - Shows the URL being generated
   - Any error messages about missing variables
   - The actual URL that's being redirected to

**What to look for:**

- If the URL is `undefined` or empty, environment variables aren't set
- If the URL looks wrong, check the format

### 3. Verify WorkOS Endpoint

The correct WorkOS authorize endpoint is:
```
https://api.workos.com/user_management/authorize
```

**Common mistakes:**

- Wrong endpoint URL
- Missing query parameters
- Incorrect redirect URI format

### 4. Check WorkOS Dashboard Configuration

The SSO provider must be configured in WorkOS Dashboard:

1. Go to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **User Management** → **Social Providers** (or **SSO Connections**)
3. Check if your SSO provider is configured
4. Verify the redirect URI matches: `http://localhost:3000/auth/callback`

### 5. Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click the login button
4. Look for a request to `api.workos.com`
5. Check:
   - Status code (404 means endpoint not found)
   - Request URL (see what's actually being called)
   - Response (may contain error details)

### 6. Common Error Messages

**"Missing NEXT_PUBLIC_WORKOS_CLIENT_ID"**
- **Fix**: Add `NEXT_PUBLIC_WORKOS_CLIENT_ID` to `.env.local`
- Restart dev server

**"OAuth configuration error"**
- **Fix**: Check all environment variables are set correctly
- Verify WorkOS Client ID format starts with `client_`

**"404 Not Found"**
- Could be:
  - Wrong endpoint URL (check console logs)
  - Microsoft provider not enabled in WorkOS Dashboard
  - Incorrect redirect URI configuration

### 7. Test Environment Variables

Create a test page to verify environment variables:

```typescript
// app/test-env/page.tsx (temporary, remove after testing)
export default function TestEnv() {
  return (
    <div>
      <p>Client ID: {process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ? 'Set' : 'Missing'}</p>
      <p>Redirect URI: {process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || 'Missing'}</p>
    </div>
  );
}
```

Visit `/test-env` to check if variables are loaded.

### 8. Restart Development Server

After changing `.env.local`:
1. Stop the dev server (Ctrl+C)
2. Start it again: `bun run dev` or `npm run dev`
3. Environment variables are only loaded on server start

---

## Still Having Issues?

1. **Check browser console** for specific error messages
2. **Check server logs** in your terminal
3. **Verify WorkOS Dashboard** configuration
4. **Test with different browser** to rule out cache issues
5. **Clear browser cache** and try again

If the issue persists, share:
- Console error messages
- Network tab details (status code, request URL)
- Environment variable status (without revealing actual values)

