# Teams & Organizations

**Status**: ✅ Complete  
**Last Updated**: 2025-01-30

---

## Overview

DocHub uses WorkOS Organizations to manage teams and access control. Teams are automatically created from organization memberships, providing seamless integration between authentication and document access.

---

## Features

### ✅ Automatic Team Creation

Teams are automatically synchronized from WorkOS Organizations:

- **When**: During user authentication (signin/callback)
- **What**: Subgroup teams (user roles within organizations) are created
- **Mapping**: Teams linked to organizations via `workos_organization_id`
- **Parent Orgs**: Parent organizations (e.g., "CDLE") are NOT teams, only roles are

**Example Flow**:
1. User joins "CDLE" organization in WorkOS
2. User has role "Developer" within "CDLE"
3. Team "Developer" is automatically created in DocHub
4. Team is linked to "CDLE" as parent organization

### ✅ Team Filtering

Users see only teams they belong to:

- **Regular Users**: Only their own team(s) visible in sidebar
- **Admin Users**: See all teams via OrganizationDisplay component
- **Sidebar Filtering**: Automatically filters based on WorkOS memberships

### ✅ Admin Organization Support

Users in admin organization get special privileges:

- **All Teams**: Admin users see all existing teams
- **Team Switching**: Admins can switch between teams via OrganizationDisplay
- **Full Access**: Access to all documents across all teams

**Configuration**:
```bash
WORKOS_ADMIN_ORGANIZATION_NAME=admin  # Optional, default: "admin"
```

### ✅ Organization Display

Header component shows current organization/team:

- **Regular Users**: Display their current team
- **Admin Users**: Can switch teams via dropdown
- **Organization Info**: Shows organization name and team name

---

## Database Schema

### Teams Table

```sql
teams (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  workos_organization_id TEXT,  -- Maps to WorkOS organization
  parent_organization_id UUID, -- For subgroup teams
  ...
)
```

### Key Relationships

- `workos_organization_id`: Links team to WorkOS organization
- `parent_organization_id`: Links subgroup teams to parent organizations

---

## Access Control

### Team-Based Access

- Documents are associated with teams
- Users only see documents from their teams (unless admin)
- Team filtering happens automatically in UI

### Admin Access

- Admin users see all teams
- Can switch teams via OrganizationDisplay
- Full document access across all teams

---

## Configuration

### Environment Variables

```bash
WORKOS_USE_ORGANIZATIONS=true  # Enable WorkOS organizations
WORKOS_ADMIN_ORGANIZATION_NAME=admin  # Admin org name (optional)
```

---

## WorkOS Setup

1. **Create Organizations**: In WorkOS Dashboard
2. **Add Users**: Add users to organizations
3. **Assign Roles**: Set user roles within organizations (these become teams)
4. **Admin Org**: Create "admin" organization (or use role "admin")

**Note**: Only subgroup teams (roles) become DocHub teams, not parent organizations.

---

## Components

- `OrganizationDisplay` - Header component for organization/team display
- Team filtering logic in sidebar
- Team sync during authentication

---

## Related Documentation

- [Authentication](AUTHENTICATION.md)
- [Admin Setup](../ADMIN_SETUP.md)
- [WorkOS Setup](../SETUP/WORKOS.md)

