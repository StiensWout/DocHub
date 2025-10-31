# Authentication & Authorization

**Status**: ✅ Complete  
**Last Updated**: 2025-01-30

---

## Overview

DocHub uses **WorkOS** for authentication and authorization, providing a provider-agnostic SSO system that supports both Single Sign-On and email/password authentication.

---

## Features

### ✅ Provider-Agnostic SSO

- **Generic SSO System**: Works with any SSO provider configured in WorkOS
- **Organization-Based Auth**: Uses WorkOS Organizations for flexible provider switching
- **No Code Changes**: Switch providers by updating organization connection in WorkOS Dashboard
- **Unified Sign-in Page**: Single UI that adapts to any provider

**Implementation**:
- Generic SSO endpoint: `/api/auth/sso`
- Callback handler: `/auth/callback`
- Supports SSO profiles and User Management users

### ✅ WorkOS Organization Memberships

Groups are sourced from WorkOS Organizations instead of database-stored groups.

**Benefits**:
- Organizations managed directly in WorkOS Dashboard
- Real-time membership updates
- Works with any SSO provider
- Automatic team creation from organizations

**Configuration**:
```bash
WORKOS_USE_ORGANIZATIONS=true
```

**How It Works**:
```
User → WorkOS Organization → DocHub Team
Admin Org → All Teams Access
```

### ✅ Automatic Team Creation

Teams are automatically created when users join WorkOS organizations:

- **Subgroup Teams Only**: Only user roles/teams within organizations become DocHub teams
- **Parent Organizations**: Organizations themselves are NOT teams (e.g., "CDLE" organization)
- **Auto-sync**: Teams sync during authentication (signin/callback)
- **Mapping**: Teams linked via `workos_organization_id` and `parent_organization_id`

**Example**:
- User in "CDLE" organization with role "Developer"
- Creates team "Developer" (not "CDLE")
- Team linked to "CDLE" organization as parent

### ✅ User Profiles & Organization Display

- User profile page at `/profile`
- Display current organization and team
- Team switching for admin users
- Organization memberships visible

**Components**:
- `OrganizationDisplay` component in header
- Admin users can switch teams
- Regular users see only their team

### ✅ Team Filtering & Access Control

- Sidebar shows only teams user belongs to (unless admin)
- Admin users see all teams via `OrganizationDisplay`
- Access control ensures users only see documents from their teams
- Teams filtered based on WorkOS organization memberships

---

## Configuration

### Required Environment Variables

```bash
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_USE_ORGANIZATIONS=true
WORKOS_ADMIN_ORGANIZATION_NAME=admin  # Optional, default: "admin"
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
SUPABASE_SERVICE_ROLE_KEY=...  # Server-side key for admin operations
```

### Admin Role Detection

Admin privileges are granted if user meets **any** of these:

1. **Organization**: User in WorkOS organization named "admin" (or `WORKOS_ADMIN_ORGANIZATION_NAME`)
2. **Role/Team**: User has role/team "admin" in any WorkOS organization
3. **Database**: Fallback to `user_roles` table (if `WORKOS_USE_ORGANIZATIONS=false`)

See [Admin Setup Guide](../ADMIN_SETUP.md) for details.

---

## Architecture

### Authentication Flow

```
SSO Flow:
User → SSO Provider (via WorkOS) → /auth/callback → Session Cookie → App

Email/Password Flow:
User → Email/Password → WorkOS User Management → Session Cookie → App
```

### Team/Organization Structure

```
Regular User:
User → 1 Organization (WorkOS) → 1 Team (User's Role within Org)

Admin User:
Admin → All Organizations → All Teams
```

### Group/Team Sync Flow

```
User Login → Check WorkOS Organizations → Create Subgroup Teams → Assign Groups
```

---

## API Endpoints

- `POST /api/auth/signin` - Email/password authentication
- `POST /api/auth/signup` - User registration  
- `GET /auth/callback` - OAuth callback handler
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Session status check
- `GET /api/user/profile` - User profile
- `GET /api/user/organizations` - User organizations

---

## Routes

- `/auth/signin` - Sign in page (SSO + email/password)
- `/auth/signup` - Registration page
- `/profile` - User profile page

---

## Future Enhancements

### WorkOS AuthKit Phase 2 (Pending)
- Multi-Factor Authentication (MFA)
- Magic Link authentication
- Passkeys support
- Password reset flows
- Email verification flows

---

## Related Documentation

- [WorkOS Setup](../SETUP/WORKOS.md)
- [SSO Configuration](../SETUP/SSO.md)
- [Provider Migration](../SETUP/PROVIDER_MIGRATION.md)
- [Admin Setup](../ADMIN_SETUP.md)

