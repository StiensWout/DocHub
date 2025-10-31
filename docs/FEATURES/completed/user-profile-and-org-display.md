# User Profile Page and Organization Display

## Overview

Add a user profile page and display the current organization/team in the interface to improve user awareness and navigation.

## Features

### 1. Current Organization Display
- **Location**: Header/Sidebar
- **Display**: Show current user's organization(s) and active team
- **Functionality**:
  - Display primary organization name (e.g., "CDLE")
  - Show current active team/subgroup (e.g., "Engineering")
  - Allow switching between teams within the same organization
  - Show organization badge/indicator in header

### 2. User Profile Page
- **Route**: `/profile` or `/user/profile`
- **Sections**:
  - **User Information**
    - Profile picture/avatar
    - Name (first, last)
    - Email address
    - User ID (WorkOS ID)
    - Account created date
  
  - **Organization Memberships**
    - List of organizations user belongs to
    - Role in each organization
    - Subgroups/teams within each organization
    - Join date for each organization
  
  - **Groups & Permissions**
    - Current groups/teams
    - User role (admin/user)
    - Document access summary
  
  - **Settings** (optional)
    - Preferences
    - Notification settings
    - Account management links

## Implementation Details

### Frontend Components

1. **OrganizationDisplay Component**
   - Location: Header or Sidebar
   - Shows: Current organization name + active team
   - Interactive: Click to view all organizations/teams
   - Styling: Badge or dropdown

2. **UserProfilePage Component**
   - Full page component at `/profile`
   - Tabbed or sectioned layout
   - Fetch user data from WorkOS and local database
   - Display organization memberships with roles

### Backend API Routes

1. **`GET /api/user/profile`**
   - Returns current user's profile information
   - Includes:
     - User details from WorkOS
     - Organization memberships with roles
     - Groups from database/WorkOS
     - User role (admin/user)

2. **`GET /api/user/organizations`**
   - Returns user's organizations and teams
   - Optional: Include team documents/applications count

### Data Sources

- **User Info**: WorkOS User Management API
- **Organizations**: WorkOS Organization Memberships
- **Groups/Teams**: WorkOS roles + DocHub teams
- **Permissions**: Local database (`user_roles`, `user_groups`)

## User Stories

1. **As a user**, I want to see which organization I'm currently in, so I know my context
2. **As a user**, I want to see my role in the organization, so I understand my permissions
3. **As a user**, I want to view my profile page, so I can see all my organization memberships
4. **As a user**, I want to switch between teams in the same organization, so I can access different team resources

## Technical Considerations

### Organization Display
- Cache organization info to avoid repeated API calls
- Update on login/team switch
- Handle multiple organizations (show primary or allow selection)

### Profile Page
- Fetch data on page load
- Show loading states
- Handle errors gracefully
- Refresh data on navigation

### Performance
- Use React Query or similar for caching
- Lazy load profile data
- Optimize API calls (batch where possible)

## Design Considerations

1. **Organization Badge**
   - Place in header (top right)
   - Shows: "CDLE • Engineering" format
   - Hover shows full details
   - Click opens dropdown/profile

2. **Profile Page Layout**
   - Header with user name and avatar
   - Tabs or sections for different info
   - Clean, readable layout
   - Mobile responsive

3. **Team Switching**
   - Dropdown or sidebar section
   - Show available teams from current organization
   - Visual indicator of active team
   - Update document access based on selected team

## Files to Create/Modify

### New Files
- `app/profile/page.tsx` - User profile page
- `components/OrganizationDisplay.tsx` - Organization badge/display
- `app/api/user/profile/route.ts` - Profile API endpoint
- `app/api/user/organizations/route.ts` - Organizations API endpoint

### Files to Modify
- `app/page.tsx` - Add organization display to header
- `components/Sidebar.tsx` - Add organization info to sidebar
- `hooks/useAuth.ts` - Add organization data to auth hook

## Acceptance Criteria

- [ ] Organization name and current team visible in header/sidebar
- [ ] User profile page displays all user information
- [ ] Organization memberships listed with roles
- [ ] Subgroups/teams shown for each organization
- [ ] User can see their role (admin/user)
- [ ] Profile page is accessible from navigation
- [ ] Organization display updates when user logs in
- [ ] Mobile responsive design
- [ ] Loading and error states handled

## Future Enhancements

- Edit profile information
- Profile picture upload
- Team/organization switching dropdown
- Activity log
- Document access history
- Notification preferences

## Dependencies

- WorkOS User Management API
- WorkOS Organization Memberships API
- Current team sync implementation
- User groups/roles system

