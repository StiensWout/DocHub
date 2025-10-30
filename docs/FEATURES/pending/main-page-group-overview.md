# Main Page Group Overview

## Overview

This feature request outlines the implementation of an application groups overview on the main/home page, replacing the recent documents section with a visually organized view of application groups. This will provide better visual organization and quicker access to applications, making it easier to navigate the workspace when many applications and groups exist.

## Goals

- Replace the recent documents section with an application groups overview
- Display application groups as organized cards/sections on the main page
- Show applications within each group in a visual grid layout
- Provide quick navigation to applications from the main page
- Improve visual organization compared to a simple list of recent documents
- Support ungrouped applications display

## User Stories

### As a user, I want to...

1. **See application groups on the main page** so I can understand the organization of my workspace at a glance
2. **See applications organized by group** so I can quickly find related applications
3. **Click on applications from the main page** so I can navigate directly to them without using the sidebar
4. **See ungrouped applications** so I can access all applications, even those not assigned to groups
5. **See visual organization** so I can better understand the structure of my workspace
6. **See group statistics** (optional) so I can understand which groups have the most activity

## Current State

### Existing Main Page Functionality
- ✅ Recent documents are displayed in a list/card format
- ✅ Main page shows welcome message when nothing is selected
- ✅ Recent documents are clickable and navigate to document viewer
- ✅ Recent documents show app name, category, and updated time

### Limitations
- ❌ No visual organization by application groups
- ❌ Recent documents don't provide context about application structure
- ❌ No way to see all applications at once on the main page
- ❌ No visual grouping of related applications
- ❌ Main page doesn't leverage application groups feature

## Proposed Features

### 1. Application Groups Overview

Replace the recent documents section with an overview of application groups, showing each group with its applications displayed in a visual grid.

#### Features
- **Group Cards**: Each group displayed as a card/section with header
- **Application Grid**: Applications within each group shown in a responsive grid
- **Group Headers**: Display group name, icon, and color theme
- **Application Cards**: Show application icon, name, and document count
- **Ungrouped Applications**: Separate section for applications without a group
- **Quick Navigation**: Click on any application to navigate directly to it
- **Visual Organization**: Better organization than a simple list of recent documents
- **Group Statistics**: Show document counts per group/app (optional enhancement)

#### UI Design

**Main Page with Group Overview:**
```
┌─────────────────────────────────────────────────────────┐
│  Welcome back!                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │ Frontend Apps                    [Icon]   │          │
│  ├──────────────────────────────────────────┤          │
│  │  ┌──────┐  ┌──────┐  ┌──────┐          │          │
│  │  │Portal│  │Admin  │  │Landing│         │          │
│  │  │12docs│  │8 docs │  │5 docs │          │          │
│  │  └──────┘  └──────┘  └──────┘          │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │ Backend Services                 [Icon]   │          │
│  ├──────────────────────────────────────────┤          │
│  │  ┌──────┐  ┌──────┐                    │          │
│  │  │API   │  │Auth  │                     │          │
│  │  │15docs│  │6 docs│                      │          │
│  │  └──────┘  └──────┘                    │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │ Other Applications                        │          │
│  ├──────────────────────────────────────────┤          │
│  │  ┌──────┐                               │          │
│  │  │Shared│                                │          │
│  │  │3docs │                                │          │
│  │  └──────┘                               │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

**Application Card Design:**
```
┌──────────────────┐
│  [Icon]          │
│  Portal          │
│  12 docs         │
└──────────────────┘
```

#### Technical Requirements
- Component: Update `app/page.tsx` welcome section
- Data: Load groups and applications with `getApplicationGroups()` and `getApplications()`
- Grouping: Organize applications by `group_id`
- Layout: Responsive grid layout for applications within groups
- Navigation: Click handler to select application and navigate to it
- Performance: Efficient grouping and rendering with many applications
- Styling: Apply group colors and application colors for visual distinction

#### Implementation Details
```typescript
// Group applications by group_id
const groupedApps = applications.reduce((acc, app) => {
  const groupId = app.group_id || 'ungrouped';
  if (!acc[groupId]) {
    acc[groupId] = [];
  }
  acc[groupId].push(app);
  return acc;
}, {});

// Render groups
{groups.map(group => (
  <GroupSection 
    key={group.id} 
    group={group}
    applications={groupedApps[group.id] || []}
    onAppClick={handleAppSelect}
  />
))}

// Render ungrouped applications
{groupedApps['ungrouped'] && (
  <UngroupedSection
    applications={groupedApps['ungrouped']}
    onAppClick={handleAppSelect}
  />
)}
```

### 2. Application Card Component

A reusable card component to display application information in the grid.

#### Features
- **Icon Display**: Show application icon with assigned color
- **Application Name**: Display application name clearly
- **Document Count**: Show number of documents in the application (optional)
- **Hover Effects**: Visual feedback on hover
- **Click Navigation**: Navigate to application on click

#### Technical Requirements
- Component: `components/ApplicationCard.tsx` (or inline in main page)
- Props: Application object, onClick handler
- Styling: Use application colors for icon and hover states
- Responsive: Adapt to different screen sizes

### 3. Group Section Component

A component to display a group with its applications.

#### Features
- **Group Header**: Display group name, icon, and color
- **Application Grid**: Responsive grid of applications within the group
- **Empty State**: Handle groups with no applications gracefully
- **Collapsible**: Optional ability to collapse/expand groups (future enhancement)

#### Technical Requirements
- Component: `components/GroupSection.tsx` (or inline in main page)
- Props: Group object, applications array, onClick handler
- Layout: Responsive grid (1-3 columns based on screen size)
- Styling: Use group colors for visual distinction

## Technical Considerations

### Dependencies

**Existing Dependencies:**
- `getApplicationGroups()` from `lib/supabase/queries.ts`
- `getApplications()` from `lib/supabase/queries.ts`
- `getAllDocumentsForApp()` for document counts (optional)

**No New Dependencies Required**

### Data Flow

1. Main page loads groups and applications on mount
2. Applications are grouped by `group_id`
3. Groups are sorted by `display_order` and then by name
4. Each group section renders its applications
5. Ungrouped applications are displayed in a separate section
6. Clicking an application calls the navigation handler

### Performance Considerations

- Load groups and applications efficiently (single query where possible)
- Cache grouped data to avoid recalculation on every render
- Lazy load document counts (optional, can be deferred)
- Optimize grid rendering for many applications

### Responsive Design

- **Desktop (1024px+)**: 3-4 columns for applications
- **Tablet (768px-1023px)**: 2 columns for applications
- **Mobile (<768px)**: 1 column for applications
- Group sections stack vertically on all screen sizes

## Implementation Phases

### Phase 1: Basic Group Overview (MVP)
- [ ] Create GroupSection component or inline section
- [ ] Create ApplicationCard component or inline card
- [ ] Update main page to load and group applications
- [ ] Display groups with applications in grid layout
- [ ] Implement click navigation to applications
- [ ] Add ungrouped applications section
- [ ] Test with various group configurations

### Phase 2: Visual Enhancements
- [ ] Apply group colors to group headers
- [ ] Apply application colors to application icons
- [ ] Add hover effects and transitions
- [ ] Improve spacing and layout
- [ ] Add empty states for empty groups

### Phase 3: Optional Enhancements
- [ ] Add document counts per application
- [ ] Add group statistics (total documents per group)
- [ ] Add collapsible/expandable groups
- [ ] Add loading states and skeletons
- [ ] Performance optimization for many groups/apps

## Success Criteria

- ✅ Main page displays application groups instead of recent documents
- ✅ Applications are organized by group visually
- ✅ Ungrouped applications are displayed in a separate section
- ✅ Users can click on applications to navigate to them
- ✅ Visual organization is clear and intuitive
- ✅ Layout is responsive and works on all screen sizes
- ✅ Group colors and application colors are applied correctly
- ✅ Performance remains good with many applications/groups

## Future Enhancements

- **Collapsible Groups**: Allow users to collapse/expand groups
- **Custom Layout**: Allow users to customize group order
- **Group Statistics**: Show activity metrics, document counts, etc.
- **Recent Activity**: Combine with recent documents in a tabbed interface
- **Search Integration**: Filter groups/applications from main page
- **Drag and Drop**: Allow reordering applications within groups (advanced)

## Related Features

- Application Management (groups must exist before displaying)
- Enhanced Navigation (sidebar also displays applications)
- Search Enhancements (search for applications/groups)

## References

- [Application Management Feature Request](./application-management.md)
- [Enhanced Navigation Feature Request](./enhanced-navigation.md)
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns) - Grid layout

---

**Priority**: Medium  
**Estimated Effort**: 3-5 days  
**Target Release**: After Application Management Phase 4 (Sidebar Display)  
**Status**: ⚠️ Not Started  
**Dependencies**: Application Management Phase 3 (Groups Backend) must be completed

