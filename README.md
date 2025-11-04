# DocHub - Documentation Manager

A beautiful, dark-mode documentation manager built with Next.js 14, TypeScript, Tailwind CSS, Bun, and Supabase. Features a rich text editor, template system, image support, document versioning, and full-text search - similar to Notion or OneNote.

## 🎯 Features

### Core Features
- 🎨 **Beautiful dark mode UI** with glassmorphism effects
- 📱 **Fully responsive design** (mobile, tablet, desktop)
- 🔍 **Full-text search** with advanced filtering and relevance ranking
- 📚 **Application-based organization** with multi-team support
- 📄 **Rich text document editing** powered by Tiptap
- 🖼️ **Image upload and embedding** via Supabase Storage
- 📋 **Template system** with predefined and custom templates
- 👥 **Multi-team support** with team-specific and shared documents
- 🌐 **Real-time database** with Supabase
- ✏️ **Full CRUD operations** (Create, Read, Update, Delete)
- 📝 **Document versioning** with complete history tracking
- 🎯 **Template-based document creation** with searchable library

### Document Management
- **Base Documents**: Shared across all teams for each application
- **Team Documents**: Team-specific documents with privacy
- **Document Categories**: Organize by category (Development, Operations, Support, etc.)
- **Document Versioning**: Complete history with version comparison
- **Rich Text Editor**: Full formatting, images, links, tables, code blocks
- **Template Library**: 6+ predefined templates, easily extensible

### Search & Discovery
- **Full-text search** across titles, categories, and content
- **Advanced filtering** by application, category, and document type
- **Relevance-based ranking** for search results
- **Real-time search** with debouncing
- **Result highlighting** and content previews

## 🚀 Quick Start

### Prerequisites

- **Bun** (v1.0+) - [Install Bun](https://bun.sh)
- **Node.js** (v18+) - Optional, if not using Bun runtime
- **Supabase Account** - [Sign up for free](https://supabase.com)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/StiensWout/DocHub.git
   cd DocHub
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   
   You can find these values in your Supabase Dashboard → Settings → API

4. **Set up the database:**
   
   You have two options:
   
   **Option A: Complete Schema Reset (Recommended for fresh setup)**
   - Go to Supabase Dashboard → SQL Editor
   - Run `supabase/purge.sql` first (removes all existing data)
   - Then run `supabase/create.sql` (creates complete schema)
   - ⚠️ **Warning**: This will delete all existing data!
   
   **Option B: Use Database Dump (If available)**
   - Run `supabase/database_dump.sql` in Supabase SQL Editor for the most up-to-date schema

5. **Set up Supabase Storage (for images):**
   - Go to Supabase Dashboard → Storage
   - Create a bucket named `documents`
   - Set it to **Public**
   - Configure storage policies (see `docs/GUIDES/rich-text-editor.md` for details)

6. **Seed the database with sample data:**
   ```bash
   bun run seed
   ```
   
   This creates:
   - 3 teams (Application, Systems, Support)
   - 2 applications (test-app-1, test-app-2)
   - Base documents and team documents
   - 6 document templates

7. **Start the development server:**
   ```bash
   bun run dev
   ```

8. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[docs/README.md](docs/README.md)** - Complete documentation index
- **[docs/INDEX.md](docs/INDEX.md)** - Documentation index and navigation
- **[docs/GETTING_STARTED/INSTALLATION.md](docs/GETTING_STARTED/INSTALLATION.md)** - Installation guide
- **[docs/GETTING_STARTED/CONFIGURATION.md](docs/GETTING_STARTED/CONFIGURATION.md)** - Configuration guide
- **[docs/DEVELOPMENT/GUIDE.md](docs/DEVELOPMENT/GUIDE.md)** - Developer guide
- **[docs/DEVELOPMENT/TESTING.md](docs/DEVELOPMENT/TESTING.md)** - Testing and validation
- **[docs/ROADMAP.md](docs/ROADMAP.md)** - Product roadmap
- **[docs/GUIDES/rich-text-editor.md](docs/GUIDES/rich-text-editor.md)** - Rich text editor guide

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Bun
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Editor**: Tiptap
- **Icons**: Lucide React

## 📁 Project Structure

```
DocHub/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── DocumentEditor.tsx
│   ├── DocumentViewer.tsx
│   ├── DocumentVersionHistory.tsx
│   ├── NewDocumentDialog.tsx
│   ├── SearchBar.tsx
│   ├── TeamSelector.tsx
│   └── TemplateSelector.tsx
├── lib/                   # Library code
│   ├── supabase/         # Supabase utilities
│   │   ├── client.ts     # Client-side Supabase client
│   │   ├── server.ts     # Server-side Supabase client
│   │   ├── queries.ts    # Database query functions
│   │   ├── search.ts     # Search functionality
│   │   └── seed.ts       # Database seeding script
│   └── templates.ts      # Template utilities
├── scripts/               # Utility scripts
│   ├── seed.ts          # Seed script runner
│   ├── validate.ts      # Database validation
│   └── check-db.ts      # Database connection check
├── supabase/             # Database schemas
│   ├── purge.sql                # Remove all database objects
│   ├── create.sql               # Create complete schema
│   ├── database_dump.sql        # Current schema (source of truth)
│   └── rls_policies.sql
├── types/                # TypeScript type definitions
└── docs/                 # Documentation
```

## 🗄️ Database Schema

The application uses the following main tables:

- **`teams`** - Team information
- **`applications`** - Shared applications across teams
- **`base_documents`** - Shared documents for each application (visible to all teams)
- **`team_documents`** - Team-specific documents (private to each team)
- **`document_templates`** - Template library for document creation
- **`document_versions`** - Version history for documents

- **Database Schema**: See `supabase/database_dump.sql` for the complete schema (source of truth)
- **Database Documentation**: See `docs/ARCHITECTURE/DATABASE.md` for schema overview

## 🎨 Rich Text Editor

DocHub features a full-featured rich text editor powered by Tiptap:

- **Text formatting**: Bold, italic, headings (H1-H3)
- **Lists**: Bullet lists and numbered lists
- **Media**: Images (upload to Supabase Storage)
- **Links**: Insert and edit hyperlinks
- **Code blocks**: Syntax highlighting ready
- **Tables**: Create and edit tables
- **Blockquotes**: Format quotes

See `docs/GUIDES/rich-text-editor.md` for detailed setup and usage instructions.

## 📋 Template System

Choose from predefined templates when creating documents:
- Meeting Notes
- Project Plan
- API Documentation
- Bug Report
- Runbook
- Architecture Document

Templates are searchable and organized by category. Custom templates can be added directly to the database.

## 🧪 Available Scripts

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint

# Database
bun run seed         # Seed database with initial data
bun run validate     # Validate database connection and data
bun run check-db     # Check database connection and tables
```

## 🔒 Security

- **Row Level Security (RLS)**: Enabled on all tables
- **Service Role Key**: Used only for admin operations (seeding)
- **Public Access**: Storage bucket configured for public image access
- **Environment Variables**: Never commit `.env.local` to version control

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**
- Verify environment variables are set correctly
- Check Supabase project is active
- Run `bun run check-db` to diagnose issues

**Images not uploading:**
- Ensure `documents` bucket exists in Supabase Storage
- Verify bucket is set to Public
- Check storage policies are configured (see `docs/GUIDES/rich-text-editor.md`)

**Templates not showing:**
- Ensure `document_templates` table exists
- Run `supabase/create.sql` (includes templates table)
- Verify database connection

**Seed script errors:**
- Check all SQL schemas are run first
- Verify environment variables are correct
- Ensure Supabase project is accessible

See `docs/TROUBLESHOOTING.md` for more troubleshooting tips.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to DocHub.

Quick steps:
1. Read the documentation in `docs/`
2. Review the [Documentation Style Guide](docs/DEVELOPMENT/STYLE_GUIDE.md)
3. Check `docs/ROADMAP.md` for planned features
4. Follow existing code style and patterns
5. Update relevant documentation when adding features
6. See [GitHub Issues](https://github.com/StiensWout/DocHub/issues) for feature tracking

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tiptap](https://tiptap.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Bun](https://bun.sh/)

---

**Need help?** Check the [documentation](docs/README.md) or create an issue.
