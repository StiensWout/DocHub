# Changelog

All notable changes and completed features in DocHub.

## [Current] - 2025-01-30

### ✨ Completed Features

#### Provider-Agnostic SSO Authentication ✅
- ✅ **Generic SSO System**: Provider-agnostic authentication architecture
- ✅ **Organization-Based Auth**: Uses WorkOS Organizations for flexible provider switching
- ✅ **Generic SSO Endpoint**: `/api/auth/sso` works with any SSO provider
- ✅ **Provider Switching**: Change providers in WorkOS Dashboard without code changes
- ✅ **Session Handling**: Supports both SSO profiles and User Management users
- ✅ **Sign-in Page**: Generic UI that adapts to any provider
- ✅ **Callback Handler**: `/auth/callback` route for SSO authentication
- ✅ **Session Management**: Proper handling of SSO profiles vs User Management users
- ✅ Sign-up page redirects to sign-in (SSO doesn't require separate sign-up)
- ✅ **Key Benefit**: Switch from test SSO to Microsoft (or any provider) by updating organization connection
- **Status**: ✅ Fully functional with test SSO, ready for production provider
- **See**: `docs/FEATURES/pending/auth-provider-switching.md` for migration guide

#### WorkOS SSO Integration - Phase 1 ✅
- ✅ Installed and configured WorkOS Node.js SDK
- ✅ Created WorkOS server-side client (`lib/workos/server.ts`)
- ✅ Created WorkOS client-side utilities (`lib/workos/client.ts`)
- ✅ Implemented session management utilities (`lib/auth/session.ts`)
- ✅ Created authentication API routes:
  - POST `/api/auth/signin` - Email/password authentication
  - POST `/api/auth/signup` - User registration
  - GET `/auth/callback` - OAuth callback handler
  - POST `/api/auth/signout` - Sign out endpoint
  - GET `/api/auth/session` - Session status check
- ✅ Created authentication UI pages:
  - `/auth/signin` - Sign in page with email/password and OAuth buttons
  - `/auth/signup` - Registration page
- ✅ Implemented Next.js middleware for route protection
- ✅ Created client-side auth hook (`hooks/useAuth.ts`)
- ✅ Added client-side authentication check on home page
- ✅ Protected routes: `/documents/*`, `/groups/*`, `/api/files/*`
- ✅ OAuth providers UI ready (Google, GitHub) - requires WorkOS Dashboard configuration
- ✅ Email verification with codes - inline code input on sign-up page
- **Status**: Phase 1 complete, Email verification complete, Phase 2 (Magic Link, Password Reset) pending
- **Note**: OAuth providers need to be configured in WorkOS Dashboard with credentials

### 🐛 Bug Fixes

#### SSO Callback Route Fix
- ✅ Fixed 404 error on `/auth/callback` - created route handler at correct path
- ✅ Updated callback to use `workos.sso.getProfileAndToken()` for SSO authentication
- ✅ Improved error handling and logging in callback route
- **Impact**: SSO authentication flow now completes successfully

#### SSO Session Handling Fix
- ✅ Fixed "User not found" error after SSO authentication
- ✅ Changed from `userManagement.getUser()` to `sso.getProfile()` for SSO tokens
- ✅ Added automatic fallback between SSO and User Management APIs
- ✅ Proper handling of SSO profiles vs User Management users
- **Impact**: Session retrieval now works correctly with SSO authentication

#### WorkOS Email Verification Fix (Legacy)
- ✅ Fixed `authenticateWithEmailVerificationCode` TypeError - method doesn't exist
- ✅ Changed to correct method: `authenticateWithEmailVerification` with `code` parameter
- **Note**: Email verification not currently used (SSO only)

#### WorkOS Navigation Fix
- ✅ Fixed runtime error when navigating from sign-in to sign-up page
- ✅ Changed `WORKOS_CLIENT_ID` to not throw on module load
- ✅ Added `requireWorkOSClientId()` function that only throws when OAuth is used
- ✅ Changed anchor tag to Next.js `router.push()` for client-side navigation
- **Impact**: Smooth navigation between auth pages without runtime errors

#### URL Navigation Consistency
- ✅ Fixed inconsistent navigation behavior between grouped and ungrouped applications
- ✅ All application clicks now use `router.push()` to update URL parameters
- ✅ Ungrouped applications now support browser history, direct linking, and bookmarking
- ✅ Consistent navigation experience across all application types
- **Impact**: Users can now bookmark, share, and use browser back/forward with all applications

### ✨ Completed Features

#### Main Page Group Overview
- ✅ Replaced recent documents with application groups overview on main page
- ✅ Group cards with headers showing group name, icon, and color
- ✅ Responsive grid layout for applications (1-4 columns based on screen size)
- ✅ Application cards with icons, names, and navigation
- ✅ Ungrouped applications section ("Other Applications")
- ✅ Group detail view with full group information
- ✅ Click navigation to applications from main page
- ✅ Click navigation to group detail view from groups overview
- ✅ Search integration - clicking groups from search navigates to group view
- ✅ URL query parameter support (`?group=groupId` and `?app=appId`)
- ✅ Breadcrumb navigation including groups
- ✅ Visual organization with group and application colors
- ✅ Empty states for groups with no applications
- ✅ Loading states for group data

#### Application & Group Search Integration
- ✅ Integrated applications and groups into search functionality
- ✅ Search results with filtering (All, Apps, Groups, Docs)
- ✅ Search suggestions include applications and groups
- ✅ Keyboard navigation support for all result types
- ✅ Dynamic styling with application/group colors

#### Application Management
- ✅ Create new applications with icon and color selection
- ✅ Edit existing applications
- ✅ Application grouping with management UI
- ✅ Group display in sidebar with collapsible sections
- ✅ Group icons and colors support

#### Document Viewer Enhancements
- ✅ Print-friendly view with comprehensive styling
- ✅ Export to PDF with print-friendly formatting
- ✅ Export to Markdown format
- ✅ Shareable document links with dynamic routes
- ✅ Share link route (`/documents/{teamId}/{appId}/{documentId}`)

#### Search Enhancements
- ✅ Search history with persistent storage (localStorage)
- ✅ Search suggestions/autocomplete
- ✅ Recent searches display
- ✅ Fuzzy matching for typo tolerance
- ✅ Keyboard navigation for search results

---

## 2025-01-30 - Navigation & Notifications

### ✨ Enhanced Navigation System
- ✅ Sidebar navigation with collapsible state
- ✅ Applications list with grouping
- ✅ Teams section with team selection
- ✅ Quick access section with recent documents
- ✅ Actions section (New Document, Upload File)
- ✅ Keyboard navigation support
- ✅ Mobile-responsive with slide-in overlay

### 📍 Breadcrumbs
- ✅ Dynamic breadcrumb generation
- ✅ Clickable navigation items
- ✅ Mobile-friendly with back button
- ✅ Integrated into document viewer and editor

### 🔔 Toast Notification System
- ✅ Context-based toast system
- ✅ Four toast types: success, error, warning, info
- ✅ Auto-dismiss with configurable duration
- ✅ Multiple toasts support
- ✅ Integrated throughout application

### 🎨 Theming System
- ✅ CSS variables for comprehensive color system
- ✅ Tailwind integration with theme tokens
- ✅ Component updates to use theme tokens
- ✅ Consistent styling across application

---

## 2025-01-30 - File Management System

### 📁 File Upload & Management
- ✅ File upload to documents and applications
- ✅ Support for multiple file types (PDF, DOCX, XLSX, PPTX, images, etc.)
- ✅ File metadata tracking (name, size, type, upload date)
- ✅ File validation and size limits (50MB max)
- ✅ Drag-and-drop file upload support
- ✅ Application-level file uploads with visibility controls
- ✅ File download and deletion
- ✅ File replacement/update option

### 👁️ In-App File Viewing
- ✅ PDF viewer with multi-page scrolling
- ✅ Word document viewer (DOCX rendering)
- ✅ Image viewer with lightbox
- ✅ Text file viewer with formatted display
- ✅ Generic file download fallback
- ✅ File type detection and routing

### ✏️ In-App File Editing
- ✅ Edit text files directly in viewer
- ✅ Support for code files (JS, TS, Python, etc.)
- ✅ Support for configuration files (JSON, YAML, XML, etc.)
- ✅ Save edited files back to storage

---

## 2025-01-30 - Core Features

### 🗄️ Database Integration
- ✅ Supabase PostgreSQL database connection
- ✅ Six main tables: teams, applications, base_documents, team_documents, document_templates, document_versions
- ✅ Document files table for file attachments
- ✅ Application groups table for organization
- ✅ Row Level Security (RLS) policies configured
- ✅ Database indexes for performance optimization
- ✅ Auto-update triggers for timestamps

### 🏗️ Application Architecture
- ✅ Next.js 14 App Router setup
- ✅ TypeScript configuration with strict mode
- ✅ Tailwind CSS with dark mode styling
- ✅ Bun as package manager and runtime
- ✅ Server-side and client-side Supabase clients

### 🎨 UI Components
- ✅ Beautiful dark mode interface with glassmorphism
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Functional search bar with real-time results
- ✅ Team selector dropdown component
- ✅ Application cards grid view
- ✅ Document viewer and editor
- ✅ Template selector component
- ✅ Loading states and skeletons
- ✅ Empty states with helpful messages

### 📄 Document Management
- ✅ Team management (3 teams seeded)
- ✅ Application management (2 applications)
- ✅ Base documents (shared across teams)
- ✅ Team documents (team-specific)
- ✅ Document CRUD operations (Create, Read, Update, Delete)
- ✅ Document categorization system
- ✅ Time-ago formatting for updates

### ✏️ Rich Text Editor (Tiptap)
- ✅ Text formatting (bold, italic, headings, lists, blockquotes, code blocks, tables)
- ✅ Link insertion and editing
- ✅ Image upload to Supabase Storage
- ✅ Drag and drop image support
- ✅ Real-time editing
- ✅ Keyboard shortcuts
- ✅ Toolbar with formatting options

### 📋 Template System
- ✅ Template library with 6 predefined templates
- ✅ Database-backed templates
- ✅ Category-based organization
- ✅ Searchable template selector
- ✅ Template preview in selector
- ✅ Application-specific templates (optional)

### 🔍 Search Functionality
- ✅ Full-text search across titles, categories, and content
- ✅ Case-insensitive matching
- ✅ Relevance scoring algorithm
- ✅ Real-time search with debouncing
- ✅ Advanced filtering (application, category, document type)
- ✅ Search result highlighting
- ✅ Result count display

### 📜 Document Versioning
- ✅ Automatic version creation on document updates
- ✅ Complete version history tracking
- ✅ Version comparison view
- ✅ Version restore capability
- ✅ Version metadata (timestamp, changes)

---

## Technical Implementation

### Frontend
- ✅ Next.js 14 App Router
- ✅ React Server Components
- ✅ Client-side state management
- ✅ Type-safe data fetching
- ✅ Tiptap rich text editor integration
- ✅ Supabase Storage for file uploads

### Backend
- ✅ Supabase PostgreSQL database
- ✅ Row Level Security (RLS)
- ✅ Server-side Supabase client
- ✅ Query functions with error handling
- ✅ Database triggers for versioning and timestamps

### Infrastructure
- ✅ Supabase Storage bucket configured
- ✅ Public storage policies
- ✅ Environment variable configuration
- ✅ TypeScript compilation
- ✅ Production build optimization

---

## Future Enhancements

See [Roadmap](ROADMAP.md) for planned features:
- Authentication & Authorization
- Real-time Collaboration
- Advanced Search Features
- Mobile App
- Enterprise Features

---

**Last Updated**: 2025-01-30

