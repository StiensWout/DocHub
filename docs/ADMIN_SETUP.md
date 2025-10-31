# Admin Role Setup Guide

## Overview

In DocHub, admin privileges are granted based on WorkOS Organization membership, not team membership. This guide explains how to configure admin access.

## Admin Role Configuration

Admin privileges can be granted in **two ways**:

### Option 1: Admin Organization (Recommended)
User belongs to a WorkOS organization with a specific name (configurable via environment variable).

1. **In WorkOS Dashboard:**
   - Create an organization named "admin" (or your preferred name)
   - Add admin users to this organization
   - Users in this organization will have admin privileges

2. **In Environment Variables:**
   ```env
   WORKOS_ADMIN_ORGANIZATION_NAME=admin  # Optional, defaults to "admin"
   ```
   
   If you want to use a different organization name for admins, set this variable.

### Option 2: Admin Role/Team (Fallback)
User has a role or team named "admin" in any WorkOS organization.

- If a user has the role "admin" assigned in any organization, they will be treated as an admin
- This is useful when you have a main organization (e.g., "CDLE") and want to grant admin privileges via the user's role/team
- No special configuration needed - just ensure the user's role in WorkOS is set to "admin"

### How It Works

The system checks admin status in this order:
1. **First**: Is the user in an organization named "admin" (or `WORKOS_ADMIN_ORGANIZATION_NAME`)?
2. **Second**: Does the user have a role/team called "admin" in any organization?
3. **Fallback**: Check database `user_roles` table (if `WORKOS_USE_ORGANIZATIONS` is false)

If any of these checks pass, the user is granted admin privileges.

## How Admin Status Works

### 1. WorkOS Organizations Mode (`WORKOS_USE_ORGANIZATIONS=true`)

When using WorkOS Organizations:
- Admin check looks for:
  1. Users in an organization matching `WORKOS_ADMIN_ORGANIZATION_NAME` (default: "admin"), OR
  2. Users with a role/team called "admin" in any organization
- Admin users can:
  - See all teams (not just their own)
  - Switch between any team via the OrganizationDisplay component
  - Access admin features (user management, etc.)

### 2. Database Mode (Fallback)

If not using WorkOS Organizations:
- Admin check looks in the `user_roles` table
- Set admin role via API: `POST /api/users/role` with `{ userId, role: "admin" }`

## Verifying Admin Status

To check if a user has admin privileges:

```typescript
import { isAdmin } from '@/lib/auth/user-groups';

const userIsAdmin = await isAdmin(); // Current user
// or
const userIsAdmin = await isAdmin(userId); // Specific user
```

## Troubleshooting

### "I have a team called 'admin' but I'm not an admin"

**Solution**: The system now checks for admin role/team! If you have a role or team called "admin" in any organization, you should be detected as admin.

However, if you're still not being detected:
1. Verify your role in WorkOS is exactly "admin" (case-insensitive)
2. Clear your session and log in again
3. Check the logs for: `[isUserInAdminOrganization] ✅ User has admin role/team`

**Alternative Solution**: Create a WorkOS organization named "admin":
- In WorkOS Dashboard, create an organization named "admin" (if it doesn't exist)
- Add your user to that organization
- The system will detect admin status on next login/session check

### "Admin check is not working"

Check:
1. `WORKOS_USE_ORGANIZATIONS=true` is set in your `.env.local`
2. The organization name matches `WORKOS_ADMIN_ORGANIZATION_NAME` (case-insensitive)
3. Your user is actually a member of that organization in WorkOS
4. Clear any cached session data and log in again

## Debugging Admin Status

You can check your admin status by calling the debug endpoint:

```bash
GET /api/debug/admin-status
```

This will return detailed information about:
- Your organization memberships
- Your roles in each organization
- Whether admin detection found a match
- The expected admin organization name

## Code Reference

- Admin check: `lib/workos/team-sync.ts::isUserInAdminOrganization()`
  - Checks for: (1) Organization named "admin", OR (2) Role/team named "admin" in any org
- User role check: `lib/auth/user-groups.ts::isAdmin()`
- Configuration: `WORKOS_ADMIN_ORGANIZATION_NAME` environment variable

