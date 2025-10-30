# DocHub - Documentation Manager

A beautiful, dark-mode documentation manager built with Next.js, TypeScript, Tailwind CSS, Bun, and Supabase. Features a rich text editor, template system, and image support similar to Notion or OneNote.

## Features

- 🎨 Beautiful dark mode UI
- 📱 Responsive design
- 🔍 Search functionality (UI ready)
- 📚 Application-based organization
- 📄 **Rich text document editing** with Tiptap
- 🖼️ **Image upload and embedding**
- 📋 **Template system** with predefined templates
- 👥 Multi-team support
- 🌐 Real-time database with Supabase
- ✏️ **Full CRUD operations** (Create, Read, Update, Delete)
- 🎯 **Template-based document creation**

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- Supabase account and project

### Setup

1. **Install dependencies:**

```bash
bun install
```

2. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. **Set up the database:**

Run the SQL schemas in your Supabase SQL Editor (in order):
- `supabase/schema.sql` - Main database schema
- `supabase/templates_schema.sql` - Template table schema
- `supabase/rls_policies.sql` - Row Level Security policies for CRUD operations
- `supabase/versioning_schema.sql` - Document versioning system

4. **Set up Supabase Storage:**

- Go to Supabase Dashboard → Storage
- Create a bucket named `documents`
- Set it to **Public**
- Configure storage policies (see `docs/RICH_TEXT_EDITOR.md`)

5. **Seed the database:**

```bash
bun run seed
```

6. **Run the development server:**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Bun** - Package manager and runtime
- **Supabase** - Database and backend
- **Tiptap** - Rich text editor
- **Lucide React** - Icons

## Database Schema

The app uses five main tables:
- `teams` - Team information
- `applications` - Shared applications across teams
- `base_documents` - Shared documents for each application
- `team_documents` - Team-specific documents
- `document_templates` - Template library

## Rich Text Editor

DocHub features a full-featured rich text editor powered by Tiptap:
- **Text formatting**: Bold, italic, headings, lists
- **Media**: Images (upload to Supabase Storage)
- **Links**: Insert and edit hyperlinks
- **Code blocks**: Syntax highlighting ready
- **Tables**: Create and edit tables
- **Blockquotes**: Format quotes

See `docs/RICH_TEXT_EDITOR.md` for detailed setup instructions.

## Template System

Choose from predefined templates when creating documents:
- Meeting Notes
- Project Plan
- API Documentation
- Bug Report
- Runbook
- Architecture Document

Templates are searchable and organized by category. Custom templates can be added to the database.

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run seed` - Seed the database with initial data
- `bun run validate` - Validate database connection and data
- `bun run check-db` - Check database connection and tables
- `bun run lint` - Run linter

## Documentation

- `docs/COMPLETED.md` - List of completed features
- `docs/ROADMAP.md` - Product roadmap
- `docs/TESTING.md` - Testing and validation report
- `docs/RICH_TEXT_EDITOR.md` - Rich text editor setup guide