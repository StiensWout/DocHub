# Admin Role Setup Guide

## Overview

In DocHub, admin privileges are granted based on WorkOS Organization membership, not team membership. This guide explains how to configure admin access.

## Admin Organization Configuration

Admin privileges are determined by checking if a user belongs to a WorkOS organization with a specific name (configurable via environment variable).

### Setting Up Admin Organization

1. **In WorkOS Dashboard:**
   - Create an organization named "admin" (or your preferred name)
   - Add admin users to this organization
   - Users in this organization will have admin privileges

2. **In Environment Variables:**
   ```env
   WORKOS_ADMIN_ORGANIZATION_NAME=admin  # Optional, defaults to "admin"
   ```
   
   If you want to use a different organization name for admins, set this variable.

### Important Distinctions

- **Organization Admin**: User is in a WorkOS organization named "admin" → Gets admin privileges
- **Team Admin**: User has a team named "admin" → Does NOT grant admin privileges (this is just a regular team)

## How Admin Status Works

### 1. WorkOS Organizations Mode (`WORKOS_USE_ORGANIZATIONS=true`)

When using WorkOS Organizations:
- Admin check looks for users in an organization matching `WORKOS_ADMIN_ORGANIZATION_NAME` (default: "admin")
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

**Solution**: You need to be in a WorkOS **organization** named "admin", not just a team. Teams and organizations are different:

- **Organization**: Created in WorkOS, can contain multiple teams/roles
- **Team**: Created in DocHub, based on user's role within an organization

To fix:
1. In WorkOS Dashboard, create an organization named "admin" (if it doesn't exist)
2. Add your user to that organization
3. The system will detect admin status on next login/session check

### "Admin check is not working"

Check:
1. `WORKOS_USE_ORGANIZATIONS=true` is set in your `.env.local`
2. The organization name matches `WORKOS_ADMIN_ORGANIZATION_NAME` (case-insensitive)
3. Your user is actually a member of that organization in WorkOS
4. Clear any cached session data and log in again

## Code Reference

- Admin check: `lib/workos/team-sync.ts::isUserInAdminOrganization()`
- User role check: `lib/auth/user-groups.ts::isAdmin()`
- Configuration: `WORKOS_ADMIN_ORGANIZATION_NAME` environment variable

