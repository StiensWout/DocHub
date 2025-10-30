# Enhanced Navigation System

## Overview

This feature request outlines the implementation of an enhanced navigation system to improve user experience, accessibility, and efficiency when navigating through teams, applications, and documents in DocHub.

## Goals

- Provide intuitive navigation that reduces clicks and improves discoverability
- Enhance user orientation within the application hierarchy
- Enable quick access to frequently used resources
- Improve mobile responsiveness with collapsible navigation
- Maintain consistency with the existing dark theme design

## User Stories

### As a user, I want to...
1. **Navigate quickly between teams and applications** so I can access different contexts without returning to the home page
2. **See my current location** (breadcrumbs) so I know where I am in the application hierarchy
3. **Access recently viewed documents** so I can quickly return to documents I was working on
4. **Access my favorite/pinned documents** so I can prioritize important documents
5. **See all teams and applications in a sidebar** so I can navigate without scrolling through the main content
6. **Use keyboard shortcuts** for common navigation actions to improve efficiency
7. **Collapse/expand the sidebar** to maximize screen space when needed
8. **Access a quick action menu** to create new documents, upload files, or perform common tasks

## Current State

### Existing Navigation
- **Header**: Contains logo, search bar, and basic actions
- **Team Selector**: Dropdown in header for selecting teams
- **Application Grid**: Cards displayed in main content area
- **Document Viewer**: Modal/overlay when viewing documents
- **No sidebar navigation**
- **No breadcrumbs**
- **No quick access menu**

### Limitations
- Users must navigate back to home to switch teams/applications
- No visual indication of current location in hierarchy
- No quick access to recent/favorite documents
- Limited keyboard navigation support
- No persistent navigation sidebar

## Proposed Features

### 1. Sidebar Navigation

A collapsible sidebar on the left side of the screen providing persistent navigation.

#### Structure
```
┌─────────────────────────────────┐
│  DocHub Logo                    │
├─────────────────────────────────┤
│  Teams                          │
│  └─ Team Alpha [►]              │
│     └─ App 1                    │
│     └─ App 2                    │
│  └─ Team Beta [►]               │
│     └─ App 3                    │
├─────────────────────────────────┤
│  Quick Access                   │
│  └─ Recent Documents            │
│  └─ Favorites                   │
│  └─ All Documents               │
├─────────────────────────────────┤
│  Actions                        │
│  └─ New Document                │
│  └─ Upload File                 │
└─────────────────────────────────┘
```

#### Features
- **Collapsible**: Sidebar can be collapsed to icon-only mode or hidden completely
- **Team/Application Tree**: Expandable tree view showing teams and their applications
- **Active State**: Highlight current team, application, and document
- **Search**: Quick search within sidebar for teams/applications
- **Keyboard Navigation**: Arrow keys, Enter, Space for navigation
- **Responsive**: Slides in/out on mobile devices

#### Technical Requirements
- Component: `components/Sidebar.tsx`
- State management: Track expanded/collapsed state, active items
- Persistence: Save sidebar state (collapsed/expanded) to localStorage
- Performance: Virtualize long lists if needed
- Accessibility: ARIA labels, keyboard navigation, focus management

### 2. Breadcrumbs

A breadcrumb trail showing the current navigation path.

#### Display Format
```
Home > Team Alpha > App 1 > Document Name
```

#### Features
- **Clickable Links**: Each breadcrumb item is clickable to navigate back
- **Truncation**: Long paths truncate with ellipsis, showing most important items
- **Current Page**: Final item is non-clickable and styled differently
- **Mobile**: Collapses to "Back" button on small screens
- **Icon Support**: Icons for teams, applications, documents

#### Technical Requirements
- Component: `components/Breadcrumbs.tsx`
- Props: `path` array with `{ label, href, icon? }`
- Responsive: Adapts to screen size
- Accessibility: ARIA navigation landmark

### 3. Quick Access Menu

A floating action menu or dropdown providing quick access to common actions.

#### Menu Items
- **Recent Documents**: Last 5-10 viewed documents
- **Favorites**: User-pinned documents (future feature)
- **Quick Actions**:
  - New Document
  - Upload File
  - New Application (if permissions allow)
  - Search
- **Keyboard Shortcuts**: Show available shortcuts

#### Implementation Options

**Option A: Floating Action Button (FAB)**
- Fixed position button (bottom-right or bottom-left)
- Opens menu on click
- Modern, mobile-friendly approach

**Option B: Header Dropdown**
- Menu button in header
- Dropdown with quick actions
- More traditional desktop approach

**Option C: Sidebar Section**
- Integrated into sidebar
- Always visible
- Consistent with sidebar navigation

**Recommendation**: Start with Option C (sidebar section) for consistency, add Option A (FAB) for mobile.

#### Technical Requirements
- Component: `components/QuickAccessMenu.tsx`
- State: Track recent documents, user preferences
- Storage: localStorage for recent documents (persist across sessions)
- Keyboard: Accessible via keyboard shortcuts

## Technical Specifications

### Components

#### `components/Sidebar.tsx`
```typescript
interface SidebarProps {
  teams: Team[];
  applications: Application[];
  selectedTeamId: string | null;
  selectedAppId: string | null;
  selectedDocumentId: string | null;
  onTeamSelect: (teamId: string) => void;
  onAppSelect: (appId: string) => void;
  onDocumentSelect: (documentId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  recentDocuments?: Document[];
  favorites?: Document[];
}
```

#### `components/Breadcrumbs.tsx`
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  maxItems?: number; // For truncation
}
```

#### `components/QuickAccessMenu.tsx`
```typescript
interface QuickAccessMenuProps {
  recentDocuments?: Document[];
  favorites?: Document[];
  onCreateDocument?: () => void;
  onUploadFile?: () => void;
  onShowShortcuts?: () => void;
}
```

### State Management

#### New State Variables
- `sidebarCollapsed: boolean` - Sidebar collapsed state
- `recentDocuments: Document[]` - Recently viewed documents
- `favorites: Document[]` - Favorited documents (future)
- `sidebarExpandedTeams: Set<string>` - Which teams are expanded in sidebar

#### State Updates
- Track document views to populate recent documents
- Save sidebar state to localStorage
- Update breadcrumbs based on current route/view

### Navigation Flow

```
Home Page
  ├─ Sidebar: All teams/applications visible
  ├─ Breadcrumbs: Home
  └─ Content: Application grid

Application View
  ├─ Sidebar: Selected team expanded, applications visible
  ├─ Breadcrumbs: Home > Team > Application
  └─ Content: Application details, documents list

Document View
  ├─ Sidebar: Selected team/app/document highlighted
  ├─ Breadcrumbs: Home > Team > Application > Document
  └─ Content: Document viewer/editor
```

### Keyboard Shortcuts

Proposed shortcuts:
- `Ctrl/Cmd + K` - Focus search
- `Ctrl/Cmd + B` - Toggle sidebar
- `Ctrl/Cmd + N` - New document
- `Ctrl/Cmd + U` - Upload file
- `Ctrl/Cmd + /` - Show keyboard shortcuts
- `Arrow Keys` - Navigate sidebar when focused
- `Esc` - Close sidebar (mobile)

### Responsive Design

#### Desktop (> 1024px)
- Sidebar: Always visible (collapsible)
- Breadcrumbs: Full trail
- Quick Access: Integrated in sidebar

#### Tablet (768px - 1024px)
- Sidebar: Collapsible, overlay mode when open
- Breadcrumbs: Full trail
- Quick Access: Integrated in sidebar

#### Mobile (< 768px)
- Sidebar: Hidden by default, slide-in overlay
- Breadcrumbs: Collapsed to "Back" button
- Quick Access: FAB or hamburger menu

## Implementation Plan

### Phase 1: Sidebar Navigation (Days 1-3)
1. Create `Sidebar.tsx` component
2. Implement team/application tree structure
3. Add collapse/expand functionality
4. Integrate with existing navigation logic
5. Add state persistence (localStorage)
6. Style to match dark theme

### Phase 2: Breadcrumbs (Days 4-5)
1. Create `Breadcrumbs.tsx` component
2. Implement breadcrumb generation logic
3. Add click handlers for navigation
4. Add responsive behavior
5. Integrate with document viewer/editor

### Phase 3: Quick Access Menu (Days 6-7)
1. Create `QuickAccessMenu.tsx` component
2. Implement recent documents tracking
3. Add quick action buttons
4. Integrate into sidebar
5. Add mobile FAB variant

### Phase 4: Polish & Integration (Days 8-10)
1. Keyboard shortcut implementation
2. Accessibility improvements (ARIA, focus management)
3. Animation/transitions
4. Mobile responsiveness testing
5. Documentation updates
6. Performance optimization

## UI/UX Considerations

### Design Principles
- **Consistency**: Match existing dark theme and color scheme
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Smooth animations, no layout shifts
- **Responsiveness**: Works on all screen sizes
- **Discoverability**: Clear visual hierarchy and affordances

### Visual Design
- **Sidebar Background**: Dark gray/black matching header
- **Active State**: Gradient highlight (blue to purple) matching brand
- **Hover States**: Subtle background color change
- **Icons**: Lucide React icons (consistent with existing)
- **Spacing**: Consistent padding/margins matching existing components

### Animation
- **Sidebar Collapse**: Smooth width transition (300ms)
- **Breadcrumb Changes**: Fade transition (200ms)
- **Menu Open**: Slide + fade (200ms)
- **Mobile Sidebar**: Slide from left (300ms)

## Database Considerations

### New Tables (Future)

#### `user_preferences`
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  sidebar_collapsed BOOLEAN DEFAULT false,
  recent_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Note**: For initial implementation, use localStorage. Database table can be added when authentication is implemented.

## Dependencies

### New Packages
- None required (using existing React, Tailwind, Lucide icons)

### Existing Dependencies Used
- `react` - Component framework
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `@supabase/supabase-js` - Data fetching

## Success Criteria

- ✅ Users can navigate between teams/applications without returning to home
- ✅ Users can see their current location via breadcrumbs
- ✅ Users can access recent documents quickly
- ✅ Sidebar is collapsible and state persists
- ✅ Navigation works on mobile devices
- ✅ Keyboard shortcuts are available and documented
- ✅ All navigation is accessible (keyboard, screen reader)
- ✅ Performance is smooth (no lag, smooth animations)
- ✅ Design matches existing dark theme

## Future Enhancements

### Phase 2 Features
- **Favorites/Pinning**: Allow users to pin documents to quick access
- **Customization**: Users can customize sidebar sections
- **Search Integration**: Sidebar search for teams/applications/documents
- **Analytics**: Track navigation patterns to improve UX
- **User Preferences**: Database-backed preferences (when auth is added)

### Advanced Features
- **Workspaces**: Multiple workspaces/saved views
- **Drag & Drop**: Reorder sidebar items
- **Keyboard Navigation**: Advanced keyboard shortcuts
- **Command Palette**: VSCode-style command palette (`Ctrl+K`)
- **Navigation History**: Browser-like back/forward navigation

## Risks & Considerations

### Performance
- **Risk**: Large teams/applications lists may impact performance
- **Mitigation**: Virtualize lists, lazy load, pagination

### Mobile UX
- **Risk**: Sidebar may feel cramped on mobile
- **Mitigation**: Overlay mode, touch-friendly interactions, gesture support

### State Management
- **Risk**: Navigation state may conflict with existing state
- **Mitigation**: Clear separation of concerns, proper state lifting

### Accessibility
- **Risk**: Complex navigation may be hard for screen readers
- **Mitigation**: Proper ARIA labels, keyboard navigation, focus management

## Testing Strategy

### Unit Tests
- Sidebar component rendering
- Breadcrumb generation logic
- Quick access menu interactions

### Integration Tests
- Navigation flow (team → app → document)
- State persistence (localStorage)
- Keyboard shortcuts

### E2E Tests
- Complete navigation journey
- Mobile responsive behavior
- Accessibility (keyboard navigation)

## Files to Create/Modify

### New Files
- `components/Sidebar.tsx` - Main sidebar component
- `components/Breadcrumbs.tsx` - Breadcrumb component
- `components/QuickAccessMenu.tsx` - Quick access menu
- `lib/navigation.ts` - Navigation utilities
- `hooks/useNavigation.ts` - Navigation hook
- `hooks/useRecentDocuments.ts` - Recent documents hook

### Modified Files
- `app/page.tsx` - Integrate sidebar and breadcrumbs
- `components/DocumentViewer.tsx` - Add breadcrumbs
- `components/DocumentEditor.tsx` - Add breadcrumbs
- `types/index.ts` - Add navigation-related types

## References

- [React Navigation Patterns](https://reactnavigation.org/docs/getting-started)
- [ARIA Navigation Landmark](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation-landmark)
- [Keyboard Navigation Best Practices](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
- [Material Design Navigation](https://m3.material.io/components/navigation-drawer/guidelines)

---

**Status**: 🟡 Pending Implementation  
**Priority**: Medium  
**Estimated Effort**: 8-10 days  
**Last Updated**: After file upload viewing system implementation

