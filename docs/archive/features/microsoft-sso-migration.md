# Migrating from Test SSO Provider to Microsoft SSO

This guide helps you migrate from a test SSO provider to Microsoft SSO for your organization.

## Current Setup

If you have configured an organization in WorkOS with a test SSO provider (using `WORKOS_ORGANIZATION_ID`), you have several options to switch to Microsoft:

## Migration Options

### Option 1: Update Organization Connection (Recommended)

Update your existing organization's connection from the test provider to Microsoft:

1. Go to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **Organizations** → Select your organization
3. Go to **Connections** tab
4. Either:
   - **Update existing connection**: Edit the current connection and change it to Microsoft OAuth/Azure AD
   - **Add new connection**: Create a new Microsoft connection and set it as the organization's primary connection
5. Keep using `WORKOS_ORGANIZATION_ID` in your `.env.local`
6. No code changes needed! The code will automatically use the updated connection

**Pros:**
- No code changes required
- Organization structure remains intact
- User associations with organization preserved

**Cons:**
- All users in the organization will need to re-authenticate with Microsoft

### Option 2: Create New Microsoft Connection and Use Connection ID

Create a dedicated Microsoft connection separate from your organization:

1. Go to [WorkOS Dashboard](https://dashboard.workos.com) → **SSO** → **Connections**
2. Click **Create Connection**
3. Select **Microsoft OAuth** or **Microsoft Entra ID (Azure AD)**
4. Configure with your Azure AD credentials (see main setup guide)
5. **Copy the Connection ID** (starts with `conn_`)
6. Update your `.env.local`:
   ```env
   # Remove or comment out organization ID
   # WORKOS_ORGANIZATION_ID=org_xxxxxxxxxxxxx
   
   # Add connection ID
   WORKOS_MICROSOFT_CONNECTION_ID=conn_xxxxxxxxxxxxx
   ```
7. Restart your dev server

**Pros:**
- Clean separation between test and production connections
- Can keep test organization for testing
- More control over connection configuration

**Cons:**
- Users won't be associated with the organization automatically
- May need to manage user-organization relationships separately

### Option 3: Create New Organization with Microsoft Connection

Create a fresh organization with Microsoft SSO:

1. Create a new Microsoft OAuth connection in WorkOS Dashboard
2. Create a new organization in WorkOS Dashboard
3. Link the Microsoft connection to the new organization
4. Update `.env.local`:
   ```env
   WORKOS_ORGANIZATION_ID=org_new_organization_id
   ```
5. Restart your dev server

**Pros:**
- Clean start with production-ready setup
- Clear separation between test and production

**Cons:**
- Loses existing organization data/user associations
- More setup work

## Recommended Approach

For a smooth migration:

1. **Start with Option 1** (Update Organization Connection) - easiest and preserves your organization structure
2. If you need to keep test environment separate, use **Option 2** (Connection ID approach)

## Testing the Migration

After migrating:

1. Clear your browser cookies/session
2. Try logging in with your Microsoft company account
3. Verify the user is properly associated with your organization
4. Test that protected routes work correctly

## Troubleshooting

If login fails after migration:

1. **Check connection configuration**: Ensure Azure AD credentials are correct in WorkOS Dashboard
2. **Verify redirect URI**: Must match what's configured in both Azure AD and WorkOS
3. **Check organization connection**: Ensure the organization is linked to the Microsoft connection
4. **Review error logs**: Check browser console and server logs for specific error messages

## Environment Variables Summary

After migration, you should have ONE of these set:

```env
# Option 1 & 3: Organization-based (recommended)
WORKOS_ORGANIZATION_ID=org_xxxxxxxxxxxxx

# Option 2: Connection-based
WORKOS_MICROSOFT_CONNECTION_ID=conn_xxxxxxxxxxxxx
```

You should NOT have both set - the code checks in this order:
1. Connection ID (if set)
2. Organization ID (if set)  
3. Provider parameter (fallback - not recommended for company accounts)
