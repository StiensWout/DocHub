# Application Management

## Overview

This feature request outlines the implementation of comprehensive application management functionality in DocHub, allowing users to create, edit, and organize applications with custom icons, colors, and grouping capabilities. This will enable better organization and customization of the documentation workspace.

## Goals

- Enable users to create new applications with custom names, icons, and colors
- Allow editing of existing applications to update their properties
- Provide application grouping functionality for better organization
- Maintain consistency with existing design patterns and UI components
- Ensure data integrity and proper validation
- Support scalable application management for teams

## User Stories

### As a user, I want to...

1. **Create new applications** so I can organize documentation for different projects or services
2. **Choose an icon for my application** from a curated list so I can visually distinguish applications
3. **Select a color theme** for my application so I can create visual organization
4. **Edit application properties** so I can update names, icons, or colors as needs change
5. **Group applications together** so I can organize related applications (e.g., "Frontend Apps", "Backend Services")
6. **See grouped applications** in the sidebar and main view so I can quickly navigate to related applications
7. **Reorder applications within groups** so I can prioritize important applications
8. **Manage application groups** so I can create, edit, or delete groups as my workspace evolves
9. **Access application settings** so I can manage all application properties in one place
10. **Search for applications and groups** so I can quickly find specific applications or application groups when I have many of them

## Current State

### Existing Application Functionality
- ✅ Applications are displayed in sidebar and main view
- ✅ Applications have icons and colors (hardcoded in seed data)
- ✅ Applications are shared across all teams
- ✅ Application cards show icon, name, and color
- ✅ Documents are linked to applications

### Limitations
- ❌ No UI to create new applications
- ❌ No UI to edit existing applications
- ❌ No application grouping functionality
- ❌ Icons and colors are hardcoded during seeding
- ❌ No application settings page
- ❌ Applications table lacks `group_id` field
- ❌ No application management UI components

## Proposed Features

### 1. Create New Applications

Allow users to create new applications through a dialog/form interface.

#### Features
- **Application Creation Dialog**: Modal dialog with form fields
- **Application Name Input**: Text input with validation (required, min 1 char, max 100 chars)
- **Icon Selection**: Grid of available Lucide icons with preview
- **Color Theme Selection**: Color picker or predefined color palette
- **Application ID Generation**: Auto-generate from name (slugified) or allow custom ID
- **Validation**: Real-time validation with error messages
- **Success Feedback**: Toast notification and navigation to new application

#### UI Design

**Application Creation Dialog:**
```
┌────────────────────────────────────────┐
│  Create New Application         [X]   │
├────────────────────────────────────────┤
│                                        │
│  Application Name *                   │
│  [_____________________________]      │
│                                        │
│  Application ID                       │
│  [customer-portal-v2________]        │
│  (Auto-generated from name)           │
│                                        │
│  Icon                                  │
│  ┌─────────────────────────────────┐  │
│  │  🔍 🔍 🔍 🔍 🔍 🔍 🔍 🔍        │  │
│  │  🔍 🔍 🔍 🔍 🔍 🔍 🔍 🔍        │  │
│  │  🔍 🔍 🔍 [✓] 🔍 🔍 🔍 🔍        │  │
│  │  🔍 🔍 🔍 🔍 🔍 🔍 🔍 🔍        │  │
│  └─────────────────────────────────┘  │
│                                        │
│  Color Theme                           │
│  ┌─────────────────────────────────┐  │
│  │  🟦 🟧 🟨 🟩 🟪 🟫 🟥           │  │
│  │  [Selected: Blue-500]           │  │
│  └─────────────────────────────────┘  │
│                                        │
│  Group (Optional)                      │
│  [Frontend Apps ▼]                    │
│                                        │
│  [Cancel]  [Create Application]        │
└────────────────────────────────────────┘
```

#### Technical Requirements
- Component: `components/ApplicationCreateDialog.tsx`
- Validation: Name required, ID must be unique, icon/color required
- API: Supabase mutation to insert new application
- Error Handling: Display validation errors and API errors
- Success Flow: Close dialog, refresh applications list, show toast

#### Implementation Details
```typescript
interface ApplicationCreateForm {
  name: string;
  id: string; // Auto-generated or custom
  icon_name: string; // Lucide icon name
  color: string; // Tailwind color class
  group_id?: string; // Optional group assignment
}

const createApplication = async (form: ApplicationCreateForm) => {
  // Validate and create application in Supabase
};
```

### 2. Edit Existing Applications

Allow users to edit application properties through a settings page or dialog.

#### Features
- **Application Settings Page/Dialog**: Dedicated page or modal for editing
- **Edit Application Name**: Update name with validation
- **Change Icon**: Select new icon from icon picker
- **Update Color Theme**: Change color with color picker
- **Change Group**: Reassign application to different group
- **Save Changes**: Update application in database
- **Cancel Changes**: Discard edits without saving
- **Validation**: Same validation as creation form

#### UI Design

**Application Settings:**
```
┌────────────────────────────────────────┐
│  Application Settings          [X]    │
├────────────────────────────────────────┤
│  Customer Portal                       │
│  ┌─────────────────────────────────┐  │
│  │  [Icon Preview]                 │  │
│  │  customer-portal                │  │
│  └─────────────────────────────────┘  │
│                                        │
│  Application Name *                   │
│  [Customer Portal____________]        │
│                                        │
│  Icon                                  │
│  [Icon Picker Grid]                   │
│                                        │
│  Color Theme                           │
│  [Color Picker]                       │
│                                        │
│  Group                                 │
│  [Frontend Apps ▼]                    │
│                                        │
│  Created: Jan 15, 2025                │
│  Last Updated: Jan 30, 2025           │
│                                        │
│  [Cancel]  [Save Changes]             │
└────────────────────────────────────────┘
```

#### Technical Requirements
- Component: `components/ApplicationSettings.tsx` or `components/ApplicationEditDialog.tsx`
- Route: `/applications/[id]/settings` (optional page route)
- API: Supabase mutation to update application
- Validation: Same as creation form
- Change Detection: Only save if changes were made

### 3. Application Grouping

Allow users to organize applications into groups/categories.

#### Features
- **Create Groups**: Create new application groups with name, icon, and color
- **Assign Applications**: Assign applications to groups (optional)
- **Group Display**: Show groups in sidebar and main view
- **Collapsible Groups**: Expand/collapse groups to show/hide applications
- **Drag-and-Drop**: Reorder applications within groups
- **Group Management**: Create, edit, delete groups
- **Group Icons and Colors**: Visual distinction for groups

#### UI Design

**Grouped Applications in Sidebar:**
```
┌────────────────────────────────────┐
│  Applications                      │
├────────────────────────────────────┤
│  ► Frontend Apps                   │
│    └─ Customer Portal              │
│    └─ Admin Dashboard              │
│                                    │
│  ► Backend Services               │
│    └─ API Gateway                  │
│    └─ Auth Service                 │
│                                    │
│  ▼ Shared                          │
│    └─ Documentation                │
└────────────────────────────────────┘
```

**Group Manager:**
```
┌────────────────────────────────────────┐
│  Manage Groups                  [X]    │
├────────────────────────────────────────┤
│  Existing Groups:                      │
│  ┌─────────────────────────────────┐  │
│  │  Frontend Apps            [✏️] [🗑️]│  │
│  │  Backend Services         [✏️] [🗑️]│  │
│  │  Shared                   [✏️] [🗑️]│  │
│  └─────────────────────────────────┘  │
│                                        │
│  [Create New Group]                    │
└────────────────────────────────────────┘
```

#### Technical Requirements
- Database Schema:
  - Add `group_id` field to `applications` table (nullable)
  - Create `application_groups` table with id, name, icon, color, order
- Component: `components/ApplicationGroupManager.tsx`
- Component: `components/ApplicationGroup.tsx` (for sidebar display)
- Drag-and-Drop: Use `react-beautiful-dnd` or `@dnd-kit/core`
- State Management: Track expanded/collapsed groups

#### Database Schema Updates

```sql
-- Add group_id to applications table
ALTER TABLE applications 
ADD COLUMN group_id UUID REFERENCES application_groups(id) ON DELETE SET NULL;

-- Create application_groups table
CREATE TABLE application_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_name TEXT, -- Optional icon
  color TEXT, -- Optional color
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for group_id
CREATE INDEX idx_applications_group_id ON applications(group_id);
```

### 4. Application & Group Search Integration

Integrate applications and application groups into the main search functionality, allowing users to search for and navigate directly to applications and groups from the search bar.

#### Features
- **Application Search**: Search applications by name
- **Group Search**: Search application groups by name
- **Search Result Display**: Show application results with icons and colors
- **Group Result Display**: Show group results with group icons and colors
- **Quick Navigation**: Click on search results to navigate directly to the application or group
- **Search Filters**: Option to filter search results by type (applications, groups, documents)
- **Integration**: Seamlessly integrate with existing search functionality

#### UI Design

**Search Results with Applications:**
```
┌────────────────────────────────────────┐
│  Search: "customer"                    │
├────────────────────────────────────────┤
│  Applications (2)                      │
│  ┌──────────────────────────────────┐  │
│  │ [Icon] Customer Portal           │  │
│  │        customer-portal            │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ [Icon] Customer Support           │  │
│  │        customer-support            │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Groups (1)                            │
│  ┌──────────────────────────────────┐  │
│  │ [Icon] Customer Apps             │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Documents (5)                         │
│  ...                                   │
└────────────────────────────────────────┘
```

#### Technical Requirements
- Component: Update `components/SearchBar.tsx` to include applications and groups
- Query Functions: Add search functions for applications and groups in `lib/supabase/search.ts` or `lib/supabase/queries.ts`
- Result Types: Extend search result types to include applications and groups
- Navigation: Handle clicks on application/group results to navigate to them
- Styling: Apply application colors and icons in search results

#### Implementation Details
```typescript
interface ApplicationSearchResult {
  type: 'application';
  id: string;
  name: string;
  icon_name: string;
  color: string;
  group_id?: string;
}

interface GroupSearchResult {
  type: 'group';
  id: string;
  name: string;
  icon_name?: string;
  color?: string;
}

// Update search to include applications and groups
const searchResults = await searchDocuments(query, teamId);
const applicationResults = await searchApplications(query);
const groupResults = await searchApplicationGroups(query);
```

### 5. UI Components

#### Icon Picker Component

A reusable component for selecting icons from Lucide icon library.

**Features:**
- Grid display of available icons
- Search/filter icons by name
- Preview selected icon
- Category grouping (optional)

**Implementation:**
```typescript
interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
  availableIcons?: string[]; // Default: all Lucide icons
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  // Display grid of icons
  // Search functionality
  // Selection handling
};
```

#### Color Picker Component

A component for selecting colors from a predefined palette or custom color picker.

**Features:**
- Predefined Tailwind color palette
- Color preview
- Custom color input (optional)

**Implementation:**
```typescript
interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  colors?: string[]; // Default: Tailwind color classes
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelect }) => {
  // Display color swatches
  // Selection handling
};
```

## Technical Considerations

### Dependencies

**New Dependencies:**
- `@dnd-kit/core` and `@dnd-kit/sortable` (for drag-and-drop) - Optional
- `react-color` or similar (for color picker) - Optional

**Existing Dependencies:**
- `lucide-react` (for icons)
- Supabase client (for database operations)

### Database Schema

**Tables to Modify:**
- `applications`: Add `group_id` field

**Tables to Create:**
- `application_groups`: Store group information

**Indexes:**
- Index on `applications.group_id` for efficient queries

### RLS Policies

**Application Management:**
- Currently applications are shared (no RLS needed)
- Future: Add RLS policies for user-specific application management

**Example Policy (Future):**
```sql
-- Allow authenticated users to create applications
CREATE POLICY "Users can create applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update applications they created
CREATE POLICY "Users can update their applications"
ON applications FOR UPDATE
TO authenticated
USING (created_by = auth.uid());
```

### Validation Rules

**Application Name:**
- Required
- Min length: 1 character
- Max length: 100 characters
- No special characters except spaces, hyphens, underscores

**Application ID:**
- Required
- Must be unique
- Lowercase, alphanumeric, hyphens, underscores only
- Auto-generated from name (slugified) or custom input

**Icon:**
- Required
- Must be valid Lucide icon name

**Color:**
- Required
- Must be valid Tailwind color class (e.g., "blue-500", "purple-600")

### Error Handling

- **Validation Errors**: Display inline errors in form fields
- **Unique Constraint Errors**: Show friendly message if ID already exists
- **Database Errors**: Display generic error message with retry option
- **Network Errors**: Show toast notification with retry option

## Implementation Phases

### Phase 1: Create New Applications (MVP) ✅ COMPLETED
- [x] Create `ApplicationCreateDialog` component
- [x] Implement icon picker component
- [x] Implement color picker component
- [x] Add form validation
- [x] Create Supabase mutation function
- [x] Add "Create Application" button to UI
- [x] Implement success feedback and navigation
- [x] Test with various inputs and edge cases
- **Completed**: 2025-01-30

### Phase 2: Edit Existing Applications ✅ COMPLETED
- [x] Create `ApplicationSettings` component/page
- [x] Add "Edit" button to application cards
- [x] Implement form pre-population with existing data
- [x] Add change detection
- [x] Create Supabase update mutation (backend ready)
- [x] Add confirmation dialog for changes
- [x] Test edit functionality
- **Status**: Completed
- **Completed**: 2025-01-30

### Phase 3: Database Schema Updates ✅ COMPLETED
- [x] Create `application_groups` table migration
- [x] Add `group_id` column to `applications` table
- [x] Create indexes for performance
- [x] Update RLS policies (if needed)
- [x] Test database migrations
- **Migration File**: `supabase/migration_application_groups.sql`
- **Completed**: 2025-01-30

### Phase 4: Application Grouping (Basic) ✅ COMPLETED
- [x] Create `ApplicationGroupManager` component
- [x] Implement group creation
- [x] Implement group assignment in application forms
- [x] Update sidebar to display groups
- [x] Add collapsible/expandable groups
- [x] Test grouping functionality
- **Completed**: 2025-01-30 (Management UI & Sidebar Display)
- **Status**: Complete - Groups are displayed in sidebar with collapsible sections

### Phase 5: Advanced Grouping Features ⚠️ PARTIALLY COMPLETED
- [ ] Implement drag-and-drop for reordering (optional)
- [x] Add group editing (name, icon, color)
- [x] Add group deletion with confirmation
- [x] Implement group icons and colors
- [x] Add group management UI
- [ ] Test all grouping features
- **Completed**: 2025-01-30 (CRUD operations)
- **Remaining**: Drag-and-drop (optional enhancement)

### Phase 7: Main Page Group Overview (Separate Feature Request)
- **See**: `docs/FEATURE_REQUESTS/main-page-group-overview.md` for detailed specification
- **Status**: Separate feature request, not part of core application management

### Phase 8: Application & Group Search Integration ✅ COMPLETED
- [x] Add applications to search functionality
- [x] Add application groups to search functionality
- [x] Update search UI to display application results with icons and colors
- [x] Update search UI to display group results
- [x] Add filter options for application/group search
- [x] Implement click handlers to navigate to applications from search results
- [x] Test search with many applications and groups
- [x] Add loading states for all operations
- [x] Improve error handling and user feedback
- [x] Add keyboard shortcuts (Escape to close dialogs)
- [x] Improve accessibility (ARIA labels, keyboard nav)
- [ ] Add animations/transitions (can be enhanced)
- [x] Update documentation
- [x] Performance testing with many applications
- [x] Mobile responsiveness testing
- **Completed**: 2025-01-30

## Success Criteria

- ✅ Users can create new applications with custom names, icons, and colors
- ✅ Users can edit existing applications (Phase 2 completed)
- ✅ Applications can be organized into groups
- ✅ Groups are displayed in sidebar with collapsible sections (Phase 4 completed)
- ⚠️ Groups are displayed in main view (sidebar complete, main page overview pending - separate feature)
- ✅ Users can search for applications and application groups in the main search bar (Phase 8 completed)
- ✅ All forms have proper validation and error handling
- ✅ Changes persist correctly in the database
- ✅ UI is responsive and accessible
- ⚠️ Performance remains good with many applications/groups (needs testing)
- ✅ All features work consistently across browsers

## Future Enhancements

- **Application Templates**: Pre-configured application templates for common use cases
- **Application Permissions**: Fine-grained permissions for who can create/edit applications
- **Application Analytics**: Track document counts, activity, etc. per application
- **Bulk Operations**: Select multiple applications for bulk edit/delete
- **Application Import/Export**: Export application configurations for backup/sharing
- **Custom Icons**: Upload custom icons instead of only using Lucide icons
- **Application Archiving**: Archive applications instead of deleting them

## Related Features

- Enhanced Navigation (sidebar displays applications)
- Document Management (documents are linked to applications)
- Search Enhancements (applications can be filtered in search)
- Authentication & Authorization (future: user-specific application management)

## References

- [Lucide Icons](https://lucide.dev/) - Icon library used
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors) - Color system
- [Supabase Database](https://supabase.com/docs/guides/database) - Database operations
- [React DnD Kit](https://docs.dndkit.com/) - Drag-and-drop library (optional)

---

**Priority**: High  
**Estimated Effort**: 1-2 weeks  
**Target Release**: After Search Enhancements

## Implementation Status

**Status**: ⚠️ In Progress  
**Completed**: 2025-01-30  
**Phases Completed**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 (partial), Phase 6 (partial), Phase 8  
**Remaining Work**: Phase 5 (Drag-and-Drop - optional), Main Page Group Overview (separate feature)  
**Note**: Main Page Group Overview is now a separate feature request (see `main-page-group-overview.md`)

### Completed Features

1. **Application Creation**
   - ✅ Full dialog with validation
   - ✅ Icon and color pickers
   - ✅ Group assignment dropdown
   - ✅ Auto ID generation
   - ✅ Success feedback

2. **Application Editing**
   - ✅ Full edit dialog component
   - ✅ Edit button integration
   - ✅ Form pre-population
   - ✅ Change detection
   - ✅ Confirmation dialog for unsaved changes
   - ✅ Partial update support (only sends changed fields)

3. **Application Groups**
   - ✅ Database schema migration
   - ✅ CRUD operations for groups
   - ✅ Group manager UI component
   - ✅ Create, edit, delete groups
   - ✅ Group icons and colors
   - ✅ Group assignment in application creation

3. **Database & Backend**
   - ✅ `application_groups` table
   - ✅ `group_id` field in applications
   - ✅ RLS policies
   - ✅ All query functions

### Remaining Work

1. **Sidebar Group Display** (Phase 4) ✅ COMPLETED
   - ✅ Organize applications by group
   - ✅ Collapsible/expandable groups
   - ✅ Ungrouped applications section
   - ✅ Group icons and colors displayed
   - ✅ Expanded state persistence
   - ✅ Keyboard navigation support
   - **Completed**: 2025-01-30

2. **Main Page Group Overview** (Separate Feature Request)
   - **See**: `docs/FEATURE_REQUESTS/main-page-group-overview.md` for detailed specification
   - Separate feature request document created

3. **Application & Group Search Integration** (Phase 8)
   - Integrate applications into search functionality
   - Integrate application groups into search functionality
   - Display search results with application icons and colors
   - Display group results in search
   - Filter options for application/group search results
   - Navigate to applications/groups from search results

4. **Optional Enhancements**
   - Drag-and-drop for group/app reordering
   - Advanced animations
   - Performance testing

