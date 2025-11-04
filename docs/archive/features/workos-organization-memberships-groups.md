# WorkOS Organization Memberships as Groups

**Status**: 🚧 In Progress  
**Priority**: Medium  
**Last Updated**: 2025-01-30

---

## Overview

This document describes using WorkOS Organization Memberships to replace database-stored groups. Instead of managing groups in the `user_groups` table, groups are retrieved from WorkOS Organizations. Users belong to organizations, and organization names/IDs are used as group names for access control.

---

## Benefits

1. **Simple Management**: Organizations are managed directly in WorkOS (Dashboard or API)
2. **No External Dependencies**: No need for directory providers like Azure AD or Okta
3. **Flexible**: Easy to create, update, and manage organizations via WorkOS API
4. **Real-time**: Organization memberships are immediately available
5. **Works with SSO**: Organizations can be used with any SSO provider configured in WorkOS

---

## Prerequisites

1. **WorkOS Organizations**:
   - Create organizations in WorkOS (via Dashboard or API)
   - Add users to organizations (via Dashboard or API)
   - Organizations act as groups for access control

2. **Environment Variable**:
   ```bash
   WORKOS_USE_ORGANIZATIONS=true
   ```

3. **API Access**: Ensure your WorkOS API key has Organizations permissions

---

## Architecture

### Current Implementation (Database Groups)
```
User → Database (user_groups table) → Groups
```

### New Implementation (WorkOS Organizations)
```
User → WorkOS Organizations → Organization Memberships → Application Groups
```

---

## Implementation Details

### 1. Organizations Utility (`lib/workos/organizations.ts`)

Provides functions to interact with WorkOS Organizations:

- `getUserGroupsFromWorkOS(userId)`: Get user's groups from organization memberships
- `getOrganizations()`: List all organizations
- `getOrganization(organizationId)`: Get specific organization details
- `getUserOrganizationMemberships(userId)`: Get user's organization memberships with details
- `addUserToOrganization(userId, organizationId)`: Add user to organization
- `removeUserFromOrganization(userId, organizationId)`: Remove user from organization

### 2. Updated User Groups (`lib/auth/user-groups.ts`)

Updated `getUserGroups()` function:

- Checks `WORKOS_USE_ORGANIZATIONS` environment variable
- If enabled, fetches groups from WorkOS Organization Memberships
- Returns organization names as group names
- Falls back to database if WorkOS groups unavailable
- Maintains backward compatibility

### 3. API Changes (`app/api/users/groups/route.ts`)

**GET Endpoint**: Unchanged - returns groups (from WorkOS or database)

**POST Endpoint**: 
- Returns error if `WORKOS_USE_ORGANIZATIONS=true`
- Groups should be managed via WorkOS Organizations API or Dashboard
- Only works in database fallback mode
- TODO: Add WorkOS Organization management support

---

## Setup Instructions

### Step 1: Create Organizations in WorkOS

1. Go to WorkOS Dashboard → Organizations
2. Create organizations that will act as groups:
   - Example: "Engineering", "Sales", "Support", etc.
   - Each organization = one group

3. Or create via API:
   ```typescript
   import { workos } from '@/lib/workos/server';
   
   await workos.organizations.createOrganization({
     name: 'Engineering',
     domains: ['engineering.company.com'], // Optional
   });
   ```

### Step 2: Add Users to Organizations

1. In WorkOS Dashboard → Organizations → Select organization → Members
2. Add users to organizations

Or via API:
```typescript
import { workos } from '@/lib/workos/server';

await workos.userManagement.createOrganizationMembership({
  userId: 'user_xxx',
  organizationId: 'org_xxx',
});
```

### Step 3: Enable in Application

Add to `.env.local`:
```bash
WORKOS_USE_ORGANIZATIONS=true
```

### Step 4: Verify Groups

1. Sign in to the application
2. Check `/api/users/groups` endpoint
3. Verify groups match your WorkOS organization names

---

## Group Mapping

### WorkOS Organizations → Application Groups

Organizations in WorkOS are used directly as application groups. For example:

**WorkOS Organizations**:
- `Engineering` → Application group: `Engineering`
- `Sales` → Application group: `Sales`
- `IT-Support` → Application group: `IT-Support`

### Document Access

Document access is still controlled via the `document_access_groups` table, which maps:
- Team document ID → Group name (from WorkOS Organizations)

The group names must match between:
1. WorkOS organization names
2. Document access groups (in `document_access_groups.group_name`)

---

## Migration Path

### Option 1: Gradual Migration (Recommended)

1. Keep `WORKOS_USE_ORGANIZATIONS=false` initially
2. Create organizations in WorkOS with names matching database group names
3. Add users to organizations in WorkOS
4. Enable `WORKOS_USE_ORGANIZATIONS=true`
5. Verify groups work correctly
6. Optionally remove database groups table (after verification)

### Option 2: Full Migration

1. Create all organizations in WorkOS
2. Migrate users to organizations (via Dashboard or API)
3. Enable `WORKOS_USE_ORGANIZATIONS=true`
4. Update document access groups to match organization names
5. Remove database group management code

---

## Limitations

1. **API Management Required**: Organizations must be managed via WorkOS Dashboard or API
   - POST `/api/users/groups` returns error when using organizations
   - TODO: Implement WorkOS Organization management in API

2. **Organization Creation**: Organizations must be created before use
   - Can be done via Dashboard or API
   - Not automatically created from database groups

3. **API Rate Limits**: WorkOS API has rate limits (check WorkOS documentation)

4. **Name Matching**: Organization names must match `document_access_groups.group_name`

---

## Fallback Behavior

The implementation includes automatic fallback to database groups:

1. If `WORKOS_USE_ORGANIZATIONS=false` → Uses database
2. If organizations not configured → Falls back to database
3. If WorkOS API error → Falls back to database
4. If no organization memberships found → Falls back to database

This ensures the application continues to work even if organizations are unavailable.

---

## Testing

### Test Organizations

```typescript
// Test in Node.js REPL or test file
import { getOrganizations } from '@/lib/workos/organizations';

const organizations = await getOrganizations();
console.log('Organizations:', organizations);
```

### Test User Groups

```typescript
import { getUserGroupsFromWorkOS } from '@/lib/workos/organizations';

const groups = await getUserGroupsFromWorkOS('user_xxx');
console.log('User groups:', groups);
```

### Test Organization Memberships

```typescript
import { getUserOrganizationMemberships } from '@/lib/workos/organizations';

const memberships = await getUserOrganizationMemberships('user_xxx');
console.log('Organization memberships:', memberships);
```

---

## Troubleshooting

### No Groups Returned

1. **Check Organization Setup**:
   - Verify organizations exist in WorkOS Dashboard
   - Check organization names match expected group names

2. **Verify User Organization Membership**:
   - User must be added to organizations in WorkOS
   - Check WorkOS Dashboard → Organizations → Members

3. **Check API Permissions**:
   - Verify WorkOS API key has Organizations access
   - Check API key permissions in WorkOS Dashboard

### Groups Not Matching

1. **Group Name Consistency**:
   - Group names must match exactly between WorkOS organizations and application
   - Case-sensitive matching
   - Check for special characters or encoding issues

2. **Document Access Groups**:
   - Update `document_access_groups` table to match organization names
   - Verify group names in `document_access_groups.group_name`

---

## API Reference

### WorkOS Organizations API

- [Organizations Documentation](https://workos.com/docs/organizations)
- [List Organizations](https://workos.com/docs/reference/organizations/list-organizations)
- [List Organization Memberships](https://workos.com/docs/reference/user-management/list-organization-memberships)
- [Create Organization Membership](https://workos.com/docs/reference/user-management/create-organization-membership)

---

## Future Enhancements

1. **Caching Layer**: Cache organization memberships to reduce API calls
2. **Webhook Integration**: Real-time organization membership updates via webhooks
3. **API Endpoint for Organization Management**: Add POST/DELETE endpoints to manage organization memberships
4. **Automatic Organization Creation**: Create organizations from database groups during migration
5. **Hybrid Mode**: Use WorkOS organizations + database for custom groups

---

## Related Documentation

- [WorkOS Setup Guide](./workos-setup-guide.md)
- [User Groups Access Control](../completed/user-groups-access-control.md)
- [WorkOS AuthKit Integration](./workos-authkit-integration.md)

---

**Questions?** Check WorkOS documentation or create an issue.

