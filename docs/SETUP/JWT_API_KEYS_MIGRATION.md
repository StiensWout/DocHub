# JWT Signing Keys and API Keys Migration Guide

This guide explains the migration from Supabase's legacy JWT secret to the new JWT Signing Keys system, and the transition to the new API keys format.

## Overview

Supabase has migrated from legacy JWT secrets to a new JWT Signing Keys system with improved security and rotation capabilities. Additionally, Supabase now offers new API keys (`sb_publishable_...` and `sb_secret_...`) that can replace the legacy JWT-based `anon` and `service_role` keys.

## Part 1: JWT Signing Keys Migration

### Current Status

The legacy JWT secret has been migrated to the new JWT Signing Keys system. This migration is handled automatically by Supabase.

### Key Concepts

- **Legacy JWT Secret**: The old symmetric key used to sign and verify JWTs
- **New JWT Signing Keys**: Asymmetric keys (public/private key pairs) that provide better security and rotation capabilities
- **Key Rotation**: The process of switching from one signing key to another without downtime

### Important Notes

⚠️ **The legacy JWT secret can only be changed by rotating to a standby key and then revoking it.**

This means:
- You cannot directly change the legacy JWT secret anymore
- To update it, you must:
  1. Generate a standby asymmetric key
  2. Rotate to the standby key
  3. Wait for existing tokens to expire (at least 1 hour + 15 minutes if token expiry is 1 hour)
  4. Revoke the legacy JWT secret

### Migration Steps (if not already done)

1. **Migrate Legacy JWT Secret** (if not already done):
   - Go to Supabase Dashboard → **Settings** → **Auth** → **JWT Signing Keys**
   - Click **"Migrate JWT secret"** button
   - This imports your existing legacy JWT secret into the new system
   - After migration, the legacy secret can no longer be rotated using the old system

2. **Generate Standby Key** (if needed):
   - Supabase automatically creates a standby asymmetric key
   - This key is advertised for future use but not yet active

3. **Rotate to Standby Key** (when ready):
   - Click **"Rotate keys"** to start using the standby key for all new JWTs
   - **Important**: Ensure your application doesn't directly rely on the legacy JWT secret for verification
   - Update Edge Functions that have "Verify JWT" enabled to use the new public key

4. **Revoke Legacy Secret** (after rotation):
   - Wait at least 1 hour + 15 minutes after rotation (if token expiry is 1 hour)
   - This ensures active users aren't forcefully signed out
   - Revoke the legacy JWT secret in the dashboard

### Impact on This Application

✅ **No code changes required** for basic JWT Signing Keys migration:
- The Supabase client libraries handle JWT verification automatically
- Your application uses `@supabase/supabase-js` which handles key rotation transparently
- JWT verification happens server-side through Supabase's API

⚠️ **If you're directly verifying JWTs** (not using Supabase client libraries):
- Update your verification code to use Supabase's JWKS endpoint
- Use libraries like `jose` to verify JWTs against the JWKS endpoint
- Example JWKS endpoint: `https://your-project.supabase.co/.well-known/jwks.json`

## Part 2: API Keys Migration

### Current Keys (Legacy JWT-based)

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Legacy `anon` key (JWT-based, starts with `eyJ...`)
- `SUPABASE_SERVICE_ROLE_KEY`: Legacy `service_role` key (JWT-based, starts with `eyJ...`)

### New API Keys (Recommended)

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: New publishable key (starts with `sb_publishable_...`)
- `SUPABASE_SECRET_KEY`: New secret key (starts with `sb_secret_...`)

### Benefits of New API Keys

✅ **Zero-downtime rotation**: Rotate keys without service interruption
✅ **Instant revocation**: Revoke individual keys without affecting others
✅ **Multiple keys**: Create multiple secret keys for different services
✅ **Better security**: Improved key management and auditing

### Migration Steps

1. **Opt-In to New API Keys**:
   - Go to Supabase Dashboard → **Settings** → **API**
   - Opt-in to the new API keys system
   - This creates a default publishable key (`sb_publishable_...`) and a secret key (`sb_secret_...`)

2. **Update Environment Variables**:
   
   **Option A: Use New Keys (Recommended)**
   
   Update your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ```
   
   **Option B: Keep Legacy Keys (Backward Compatible)**
   
   Legacy keys still work, but consider migrating for better security:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Legacy anon key
   SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Legacy service_role key
   ```

3. **Update Code** (if switching to new keys):
   
   The code automatically supports both formats, but you can optionally update variable names:
   
   - `lib/supabase/client.ts`: Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `lib/supabase/server.ts`: Uses `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`

4. **Test the Migration**:
   ```bash
   bun run check-db  # Verify database connection
   bun run dev       # Test application functionality
   ```

5. **Disable Legacy Keys** (optional, after confirming new keys work):
   - Go to Supabase Dashboard → **Settings** → **API**
   - Optionally disable the legacy `anon` and `service_role` keys
   - **Note**: Only disable after confirming everything works with new keys

### Code Compatibility

✅ **Current code supports both formats**:
- The Supabase client library accepts both legacy and new key formats
- No immediate code changes required
- You can migrate gradually

## Migration Checklist

### JWT Signing Keys
- [ ] Verify legacy JWT secret has been migrated (check Supabase Dashboard)
- [ ] Review JWT Signing Keys page in dashboard
- [ ] Plan key rotation if needed (generate standby key, rotate, wait for expiry, revoke)
- [ ] Update any direct JWT verification code (if applicable)

### API Keys
- [ ] Opt-in to new API keys in Supabase Dashboard
- [ ] Copy new `sb_publishable_...` key
- [ ] Copy new `sb_secret_...` key
- [ ] Update `.env.local` with new keys (or keep legacy keys)
- [ ] Test application with new keys
- [ ] Update documentation/team about new key names
- [ ] Optionally disable legacy keys after confirming everything works

## Security Best Practices

1. **Never commit keys to version control**:
   - Keep all keys in `.env.local` (in `.gitignore`)
   - Use different keys for development and production

2. **Rotate keys regularly**:
   - Use the new API keys system for easier rotation
   - Rotate keys if they're compromised or exposed

3. **Use appropriate keys**:
   - Publishable keys: Safe to expose in client-side code
   - Secret keys: **NEVER expose** - server-side only
   - Service role/secret keys bypass RLS policies

4. **Monitor key usage**:
   - Review Supabase Dashboard for key usage patterns
   - Set up alerts for suspicious activity

## Troubleshooting

### "Invalid API key" errors after migration

- Verify you copied the entire key (no truncation)
- Check for extra spaces or line breaks
- Ensure you're using the correct key type (publishable vs secret)
- Restart your development server after updating `.env.local`

### JWT verification failures

- Verify JWT Signing Keys are properly configured in dashboard
- Check token expiry settings
- Ensure your application uses Supabase client libraries (recommended)
- If verifying directly, update to use JWKS endpoint

### Application not working after key update

- Check environment variables are loaded (restart server)
- Verify keys are correct format (legacy: `eyJ...`, new: `sb_...`)
- Test with legacy keys first, then migrate to new keys
- Check Supabase Dashboard for any key-related errors

## References

- [Supabase JWT Signing Keys Documentation](https://supabase.com/docs/guides/auth/signing-keys)
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Supabase JWTs Guide](https://supabase.com/docs/guides/auth/jwts)

## Support

If you encounter issues during migration:
1. Check Supabase Dashboard for error messages
2. Review Supabase documentation
3. Test with legacy keys first to isolate the issue
4. Contact Supabase support if needed

