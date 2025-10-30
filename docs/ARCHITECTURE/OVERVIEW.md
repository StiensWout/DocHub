# Architecture Overview

High-level overview of DocHub's architecture, tech stack, and design decisions.

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server-side rendering
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Tiptap** - Rich text editor framework

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Storage (file uploads)
  - Auth-ready (not yet implemented)

### Tools & Runtime
- **Bun** - Package manager and runtime
- **ESLint** - Code linting
- **Git** - Version control

## 📁 Project Structure

```
DLWait/
├── app/                      # Next.js App Router
│   ├── globals.css           # Global styles and Tailwind
│   ├── layout.tsx            # Root layout component
│   ├── page.tsx              # Main page component
│   └── documents/            # Dynamic routes
│
├── components/              # React components
│   ├── DocumentEditor.tsx    # Rich text editor
│   ├── DocumentViewer.tsx   # Document display
│   ├── SearchBar.tsx        # Search functionality
│   ├── Sidebar.tsx          # Navigation sidebar
│   └── ...
│
├── lib/                      # Shared library code
│   ├── supabase/
│   │   ├── client.ts        # Client-side Supabase client
│   │   ├── server.ts        # Server-side Supabase client
│   │   ├── queries.ts       # Database query functions
│   │   ├── search.ts        # Search logic
│   │   └── seed.ts          # Database seeding
│   └── templates.ts         # Template utilities
│
├── types/                    # TypeScript type definitions
│   └── index.ts             # Shared types
│
├── scripts/                  # Utility scripts
│   ├── seed.ts              # Database seeding script
│   └── validate.ts         # Database validation
│
├── supabase/                 # Database schemas
│   ├── complete_schema.sql  # Complete schema (fresh setup)
│   ├── schema.sql          # Main schema
│   └── ...
│
└── docs/                     # Documentation
```

## 🎯 Design Principles

### 1. Type Safety
- TypeScript throughout
- Type definitions for all database entities
- Type-safe database queries

### 2. Component-Based Architecture
- Reusable React components
- Separation of concerns (UI, logic, data)
- Single responsibility principle

### 3. Database-First Approach
- Supabase PostgreSQL as single source of truth
- Row Level Security (RLS) for data access
- Proper indexing for performance

### 4. Developer Experience
- Clear documentation
- Helper scripts (seed, validate)
- Consistent code style

## 🔄 Data Flow

### Document Creation Flow

```
User Action
    ↓
Component (NewDocumentDialog)
    ↓
Type Selection (Base/Team)
    ↓
Database Query (lib/supabase/queries.ts)
    ↓
Supabase Database
    ↓
State Update
    ↓
UI Refresh
```

### Document Editing Flow

```
User Opens Document
    ↓
DocumentViewer Component
    ↓
User Clicks Edit
    ↓
DocumentEditor Component
    ↓
Tiptap Editor (Rich Text)
    ↓
User Saves
    ↓
Database Update
    ↓
Version Created (Automatic)
    ↓
UI Refresh
```

### Search Flow

```
User Types Query
    ↓
Debounced Search (300ms)
    ↓
Search Functions (lib/supabase/search.ts)
    ↓
Supabase Full-Text Search
    ↓
Relevance Scoring
    ↓
Results Displayed
```

## 🗄️ Database Architecture

### Core Tables

- **teams** - Team information
- **applications** - Shared applications across teams
- **base_documents** - Shared documents (visible to all teams)
- **team_documents** - Team-specific documents
- **document_templates** - Template library
- **document_versions** - Version history
- **document_files** - File attachments
- **application_groups** - Application organization

See [Database Architecture](DATABASE.md) for detailed schema.

## 🎨 UI Architecture

### Component Hierarchy

```
App Layout
├── Sidebar (Navigation)
│   ├── Teams Section
│   ├── Applications (Grouped)
│   └── Quick Access
│
└── Main Content
    ├── Search Bar
    ├── Document Viewer/Editor
    └── Application Details
```

### State Management

- React hooks (`useState`, `useEffect`)
- Local component state
- `localStorage` for persistence (sidebar collapse, recent docs)
- Supabase for server state

### Styling

- Tailwind CSS utility classes
- CSS variables for theming
- Dark mode by default
- Responsive design (mobile, tablet, desktop)

## 🔐 Security Architecture

### Current State

- Row Level Security (RLS) enabled on all tables
- Public read access (will be restricted with auth)
- Service role key used server-side only

### Future (With Authentication)

- Supabase Auth integration
- User-based RLS policies
- Team-based access control
- Document-level permissions

## 📦 Key Libraries

### Tiptap Extensions

- `@tiptap/starter-kit` - Core formatting
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-link` - Link support
- `@tiptap/extension-placeholder` - Placeholder text

### Supabase

- `@supabase/supabase-js` - Client library
- Direct SQL queries for complex operations

### File Handling

- `pdfjs-dist` - PDF viewing
- `docx-preview` - Word document viewing
- Native file APIs for uploads

## 🚀 Deployment Considerations

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side key (secret)

### Build Process

```bash
bun run build    # Production build
bun run start     # Production server
```

### Database Migrations

- SQL files in `supabase/`
- Run migrations in Supabase SQL Editor
- Version migrations with descriptive names

## 📚 Related Documentation

- [Database Architecture](DATABASE.md) - Detailed database schema
- [Component Architecture](COMPONENTS.md) - Component structure
- [Development Guide](../DEVELOPMENT/GUIDE.md) - Development workflow

---

**Last Updated**: 2025-01-30

