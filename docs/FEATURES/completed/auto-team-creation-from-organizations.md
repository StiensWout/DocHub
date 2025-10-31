# Automatic Team Creation from WorkOS Organizations

## Overview

DocHub now automatically creates teams when users join new WorkOS organizations. This ensures that organization membership in WorkOS is automatically reflected in DocHub teams, eliminating manual team management.

## Features

### 1. Automatic Team Sync

When a user with a new WorkOS organization gets added to DocHub:
- The corresponding team is automatically created in DocHub (if it doesn't exist)
- Teams are created based on the organization name
- The mapping between WorkOS organizations and DocHub teams is stored in the `workos_organization_id` column

### 2. Admin Organization Support

When a user is a member of an "admin" organization:
- They see **all existing teams/groups** in DocHub
- An "Admin" group is automatically included in their groups list
- This gives admins full visibility into all teams

## Configuration

### Environment Variables

- `WORKOS_USE_ORGANIZATIONS=true` - Enable WorkOS Organization Memberships for groups
- `WORKOS_ADMIN_ORGANIZATION_NAME=admin` - Name of the admin organization (default: "admin")

### Database Schema

The `teams` table now includes:
```sql
workos_organization_id TEXT -- Maps to WorkOS organization ID (optional, for syncing)
```

This column stores the WorkOS organization ID to maintain the mapping between organizations and teams.

## How It Works

1. **User Authentication**: When a user signs in (SSO or email/password)
2. **Organization Check**: System checks user's WorkOS organization memberships
3. **Team Creation**: For each organization the user belongs to:
   - Check if a team with that name exists
   - If not, create a new team with the organization name
   - Store the `workos_organization_id` mapping
4. **Admin Check**: If user is in admin organization:
   - Return all teams plus "Admin" group
5. **Regular Users**: Return only teams from their organizations

## Migration

For existing databases, run the migration script:

```sql
-- supabase/migrations/add_workos_org_id_to_teams.sql
ALTER TABLE teams ADD COLUMN workos_organization_id TEXT;
CREATE INDEX idx_teams_workos_org_id ON teams(workos_organization_id);
```

## API Functions

### `getUserGroups(userId: string)`

Automatically:
- Syncs teams from user's organizations
- Checks for admin organization membership
- Returns appropriate groups (all teams for admins, user's teams for regular users)

### `syncTeamsFromUserOrganizations(userId: string)`

Creates teams in DocHub for any organizations the user belongs to that don't have corresponding teams yet.

### `ensureTeamForOrganization(organizationName: string, organizationId?: string)`

Ensures a team exists for a WorkOS organization. Creates it if missing, returns existing team ID if present.

### `isUserInAdminOrganization(userId: string)`

Checks if user is a member of the admin organization (configurable via `WORKOS_ADMIN_ORGANIZATION_NAME`).

## Example Flow

1. **New User Joins Organization**:
   ```
   User → Added to "Engineering" org in WorkOS
   User signs in → DocHub checks organizations
   → Creates "Engineering" team in DocHub
   → User sees "Engineering" group
   ```

2. **Admin User**:
   ```
   Admin user → Member of "admin" org in WorkOS
   Admin signs in → DocHub detects admin org
   → Returns all existing teams + "Admin" group
   → Admin sees: ["Admin", "Engineering", "Sales", "Support"]
   ```

3. **Regular User**:
   ```
   Regular user → Member of "Engineering" org only
   User signs in → DocHub syncs teams
   → Returns only: ["Engineering"]
   ```

## Benefits

- **No Manual Team Management**: Teams are automatically created from WorkOS organizations
- **Centralized Control**: Manage teams/groups in WorkOS Dashboard
- **Admin Visibility**: Admins automatically see all teams
- **Consistent Naming**: Team names match organization names
- **Bi-directional Mapping**: `workos_organization_id` tracks the relationship

## Notes

- Teams are created on-demand when users access DocHub
- Admin organization name is case-insensitive
- If team already exists by name, no duplicate is created
- The mapping allows future features like organization-based access control

