# User Groups and Access Control

**Status**: ✅ Complete  
**Priority**: 🔥 High  
**Last Updated**: 2025-01-30

---

## Overview

Implemented a comprehensive user group-based access control system that allows:
- **All users** in the organization to access the same applications
- **Users assigned to different groups** to access different group-specific documents
- **Admin role** that can see all documents and manage user groups
- **Future-ready** for AD group integration

---

## Architecture

### Database Schema

Created new tables in `supabase/user_groups_schema.sql`:

1. **`user_groups`** - Maps WorkOS user IDs to group names
   - `user_id` - WorkOS SSO profile ID (prof_xxxxx)
   - `group_name` - Group name (e.g., "Engineering", "Sales")

2. **`user_roles`** - User roles (admin/user)
   - `user_id` - WorkOS SSO profile ID
   - `role` - 'admin' or 'user' (default: 'user')

3. **`document_access_groups`** - Maps team documents to access groups
   - `team_document_id` - Reference to team_documents table
   - `group_name` - Must match group_name in user_groups

### Access Control Rules

1. **Base Documents**: Visible to ALL users (no group restriction)
2. **Team Documents**: 
   - Visible to users in assigned groups (via `document_access_groups`)
   - Visible to ALL users if user is admin
3. **Admin Users**: Can see ALL documents regardless of group assignments

---

## Implementation

### API Endpoints

#### `/api/documents` (GET)
- Filters documents based on user's groups
- Admins see all documents
- Regular users see base docs + team docs for their groups

#### `/api/users/groups` (GET, POST)
- **GET**: Get user's groups (or specific user's groups if admin)
- **POST**: Assign groups to user (admin only)

#### `/api/users/role` (GET, POST)
- **GET**: Get user's role
- **POST**: Set user role (admin only)

#### `/api/users/all` (GET)
- Get all users with their roles and groups (admin only)

#### `/api/documents/access` (GET, POST)
- **GET**: Get document access groups
- **POST**: Set document access groups (admin only)

### Components

#### `UserGroupManager`
- Admin-only UI for managing users
- Assign users to groups
- Set user roles (admin/user)
- View all users in the organization

#### `Sidebar` (Updated)
- Added logout button in footer
- Added "Manage Users" button in Admin section (admin only)

### Utilities

#### `lib/auth/user-groups.ts`
- `getUserGroups()` - Get user's groups
- `isAdmin()` - Check if user is admin
- `getUserRole()` - Get user's role
- `getAllUsers()` - Get all users (admin only)

---

## User Flow

### Regular User
1. Signs in via SSO
2. Sees all applications (same for everyone)
3. Sees base documents (shared across organization)
4. Sees team documents only for groups they're assigned to
5. Cannot access admin features

### Admin User
1. Signs in via SSO
2. Sees all applications
3. Sees ALL documents (base + all team documents)
4. Can access "Manage Users" in sidebar
5. Can assign users to groups
6. Can set user roles (admin/user)
7. Can manage document access groups

---

## Setup Instructions

### 1. Run Database Schema

Run `supabase/user_groups_schema.sql` in Supabase SQL Editor:

```sql
-- Creates user_groups, user_roles, and document_access_groups tables
-- Sets up RLS policies
-- Creates indexes
```

### 2. Create First Admin User

After running the schema, manually create your first admin user:

```sql
-- Replace 'prof_xxxxxxxxxxxxx' with your WorkOS user ID
INSERT INTO user_roles (user_id, role)
VALUES ('prof_xxxxxxxxxxxxx', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

You can find your WorkOS user ID by:
- Checking the session API response: `/api/auth/session`
- Looking at the `id` field in the user object

### 3. Assign Users to Groups

Via Admin UI:
1. Sign in as admin
2. Click "Manage Users" in sidebar
3. Assign users to groups
4. Create new groups as needed

Via SQL (for bulk operations):
```sql
INSERT INTO user_groups (user_id, group_name)
VALUES 
  ('prof_xxx', 'Engineering'),
  ('prof_yyy', 'Sales'),
  ('prof_zzz', 'Support');
```

### 4. Set Document Access Groups

For team documents to be accessible only to specific groups:

```sql
INSERT INTO document_access_groups (team_document_id, group_name)
VALUES 
  ('doc-uuid-1', 'Engineering'),
  ('doc-uuid-2', 'Sales');
```

Or via Admin UI (when editing documents - to be implemented).

---

## Features

✅ **Logout Button**
- Located in sidebar footer
- Clears session and redirects to sign-in

✅ **User Groups**
- Users can be assigned to multiple groups
- Groups control access to team documents
- Groups can be managed by admins

✅ **Admin Role**
- Admins see all documents
- Admins can manage users and groups
- Admin UI with user management

✅ **Document Filtering**
- Automatic filtering based on user groups
- Base documents always visible
- Team documents filtered by group access

✅ **Future-Ready**
- Database schema supports AD group integration
- Can map AD groups to application groups
- Role system extensible for future permissions

---

## Future Enhancements

### AD Group Integration
- Sync AD groups with `user_groups` table
- Automatic role assignment from AD groups
- Periodic sync of group memberships

### Document-Level Permissions
- Assign document access on per-document basis
- Multiple groups per document
- More granular control

### Group Management UI
- Create/edit/delete groups
- View group members
- Group-specific settings

---

## API Usage Examples

### Get Current User's Groups
```typescript
const response = await fetch('/api/users/groups');
const { groups } = await response.json();
// ['Engineering', 'Sales']
```

### Check if User is Admin
```typescript
const response = await fetch('/api/users/role');
const { role } = await response.json();
// 'admin' or 'user'
```

### Assign User to Groups (Admin only)
```typescript
await fetch('/api/users/groups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'prof_xxxxx',
    groups: ['Engineering', 'Sales'],
  }),
});
```

### Get Filtered Documents
```typescript
const response = await fetch(`/api/documents?teamId=${teamId}&appId=${appId}`);
const { documents, isAdmin, userGroups } = await response.json();
// Documents filtered by user's groups (unless admin)
```

---

## Security Considerations

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Admin checks on all sensitive endpoints
- ✅ Users can only see their own groups/roles
- ✅ Document access filtered server-side
- ✅ No client-side security checks (all server-validated)

---

## Related Documentation

- `docs/FEATURES/pending/workos-authkit-integration.md` - WorkOS integration
- `docs/FEATURES/pending/auth-provider-switching.md` - SSO provider switching
- `supabase/user_groups_schema.sql` - Database schema

