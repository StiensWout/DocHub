# Setting Up User Groups and Access Control

## Quick Setup Guide

### Step 1: Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/create.sql` (if not already run) - this includes the user groups schema
3. Click "Run"
4. Verify tables are created: `user_groups`, `user_roles`, `document_access_groups`

### Step 2: Create Your First Admin User

After signing in, get your WorkOS user ID from the browser console or session:

```sql
-- Replace 'prof_xxxxxxxxxxxxx' with your actual WorkOS user ID
-- You can find it by calling /api/auth/session after logging in
INSERT INTO user_roles (user_id, role)
VALUES ('prof_xxxxxxxxxxxxx', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

**How to find your user ID:**
1. Sign in to the app
2. Open browser console
3. Check `/api/auth/session` response - the `id` field is your user ID (starts with `prof_`)

### Step 3: Assign Users to Groups

**Option A: Via Admin UI (Recommended)**
1. Sign in as admin
2. Click "Manage Users" in sidebar (Admin section)
3. Assign users to groups

**Option B: Via SQL**
```sql
INSERT INTO user_groups (user_id, group_name)
VALUES 
  ('prof_user1', 'Engineering'),
  ('prof_user1', 'Sales'),  -- Users can be in multiple groups
  ('prof_user2', 'Support');
```

### Step 4: Assign Documents to Groups

Documents are accessible to users in assigned groups. By default, team documents are not restricted (visible to all).

**To restrict a document to specific groups:**

```sql
INSERT INTO document_access_groups (team_document_id, group_name)
VALUES 
  ('doc-uuid-1', 'Engineering'),
  ('doc-uuid-2', 'Sales');
```

**Note:** Base documents are always visible to all users and cannot be restricted.

### Step 5: Test Access

1. **As Admin:**
   - Should see all documents
   - Should see "Manage Users" in sidebar
   - Can assign users to groups

2. **As Regular User:**
   - Should see base documents (all)
   - Should see team documents only for their assigned groups
   - Should NOT see "Manage Users" button

---

## Current Access Model

- ✅ **All users** see the same applications
- ✅ **All users** see base documents (shared)
- ✅ **Regular users** see team documents for their assigned groups only
- ✅ **Admin users** see all documents
- ✅ **Admin users** can manage user groups and roles

---

## Future: AD Group Integration

The system is ready for AD group integration. When implementing:

1. Map AD groups to application groups in `user_groups` table
2. Sync AD group memberships periodically
3. Auto-assign roles based on AD group membership
4. Use WorkOS Directory Sync or custom sync mechanism

See [GitHub Issues](https://github.com/StiensWout/DocHub/issues) for detailed feature documentation.

