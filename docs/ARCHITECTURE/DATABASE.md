# Database Architecture

Complete database schema documentation for DocHub.

## 📊 Schema Overview

DocHub uses PostgreSQL via Supabase with the following core entities:

- **Teams** - Organization units
- **Applications** - Shared applications (grouped)
- **Documents** - Base (shared) and Team (private)
- **Templates** - Document templates
- **Versions** - Document version history
- **Files** - File attachments
- **Groups** - Application organization

## 🗃️ Tables

### teams

Team information and organization.

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - UUID primary key
- `name` - Team name (unique identifier)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Indexes:**
- Primary key on `id`

---

### applications

Shared applications across all teams.

```sql
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  color TEXT NOT NULL,
  group_id UUID REFERENCES application_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - TEXT primary key (e.g., "customer-portal")
- `name` - Application display name
- `icon_name` - Lucide icon name
- `color` - Tailwind color class
- `group_id` - Optional group assignment
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `group_id`

**Relationships:**
- Belongs to `application_groups` (optional)
- Has many `base_documents`
- Has many `team_documents`
- Has many `document_templates` (optional)
- Has many `document_files` (application-level)

---

### application_groups

Organizational groups for applications.

```sql
CREATE TABLE application_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_name TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - UUID primary key
- `name` - Group name
- `icon_name` - Optional Lucide icon name
- `color` - Optional Tailwind color class
- `display_order` - Sort order
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `display_order`

**Relationships:**
- Has many `applications`

---

### base_documents

Shared documents visible to all teams.

```sql
CREATE TABLE base_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - UUID primary key
- `application_id` - Foreign key to `applications`
- `title` - Document title
- `category` - Document category
- `content` - HTML content (from Tiptap editor)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Indexes:**
- Primary key on `id`
- Index on `application_id`

**Relationships:**
- Belongs to `applications`
- Has many `document_versions`
- Has many `document_files`

---

### team_documents

Team-specific documents (private to each team).

```sql
CREATE TABLE team_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - UUID primary key
- `team_id` - Foreign key to `teams`
- `application_id` - Foreign key to `applications`
- `title` - Document title
- `category` - Document category
- `content` - HTML content (from Tiptap editor)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Indexes:**
- Primary key on `id`
- Index on `(team_id, application_id)`
- Index on `application_id`

**Relationships:**
- Belongs to `teams`
- Belongs to `applications`
- Has many `document_versions`
- Has many `document_files`

---

### document_templates

Template library for document creation.

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  application_id TEXT REFERENCES applications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - UUID primary key
- `name` - Template name
- `description` - Template description
- `content` - HTML template content
- `category` - Template category
- `application_id` - Optional application association
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `category`
- Index on `application_id`

**Relationships:**
- Belongs to `applications` (optional)

---

### document_versions

Version history for documents.

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('base', 'team')),
  version_number INTEGER NOT NULL,
  content TEXT,
  title TEXT,
  category TEXT,
  change_summary TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, document_type, version_number)
);
```

**Fields:**
- `id` - UUID primary key
- `document_id` - UUID of the document (references `base_documents.id` or `team_documents.id`)
- `document_type` - Type: 'base' or 'team'
- `version_number` - Sequential version number
- `content` - Content snapshot
- `title` - Title snapshot
- `category` - Category snapshot
- `change_summary` - Optional change description
- `created_by` - User ID (when auth is implemented)
- `created_at` - Version creation timestamp

**Indexes:**
- Primary key on `id`
- Index on `(document_id, document_type)`
- Unique constraint on `(document_id, document_type, version_number)`

**Note:** Foreign key constraint handled in application logic due to polymorphic relationship.

---

### document_files

File attachments for documents or applications.

```sql
CREATE TABLE document_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID,
  document_type TEXT CHECK (document_type IN ('base', 'team')),
  application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'documents',
  visibility TEXT NOT NULL DEFAULT 'team' CHECK (visibility IN ('public', 'team')),
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path),
  CHECK (
    (document_id IS NOT NULL AND document_type IS NOT NULL) OR
    (application_id IS NOT NULL)
  )
);
```

**Fields:**
- `id` - UUID primary key
- `document_id` - Document ID (NULL for application-level files)
- `document_type` - 'base' or 'team' (NULL for application-level files)
- `application_id` - Application ID (NULL for document-level files)
- `team_id` - Team ID (NULL for public application files)
- `file_name` - Original file name
- `file_path` - Supabase Storage path (unique)
- `file_type` - MIME type
- `file_size` - File size in bytes
- `storage_bucket` - Storage bucket name (default: 'documents')
- `visibility` - 'public' (all teams) or 'team' (specific team)
- `uploaded_by` - User ID (when auth is implemented)
- `uploaded_at` - Upload timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `(document_id, document_type)`
- Unique constraint on `file_path`

**Relationships:**
- Belongs to `applications` (for application-level files)
- Belongs to `teams` (optional, for team-specific application files)

**Storage Path Structure:**
- Document files: `documents/{team_id}/{application_id}/{document_id}/{file_id}_{file_name}`
- Application files: `documents/{team_id}/{application_id}/application/{file_id}_{file_name}`

## 🔗 Relationships Diagram

```
teams
  └─< team_documents >─ applications
                           ├─< base_documents
                           ├─< document_templates
                           ├─< document_files (application-level)
                           └─< application_groups

application_groups
  └─< applications

document_versions
  └─ references base_documents or team_documents (polymorphic)

document_files
  ├─ references base_documents (document-level)
  ├─ references team_documents (document-level)
  └─ references applications (application-level)
```

## 🔄 Triggers & Functions

### Auto-Update Timestamps

All tables with `updated_at` have triggers that automatically update the timestamp:

```sql
CREATE TRIGGER update_{table}_updated_at BEFORE UPDATE ON {table}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Version Creation

Automatic version creation triggers:

- `create_team_document_version` - Creates version on `team_documents` update
- `create_base_document_version` - Creates version on `base_documents` update

## 🔐 Row Level Security (RLS)

RLS is enabled on all tables. Current policies allow public access (will be restricted with authentication):

- **SELECT** - Public read access
- **INSERT** - Public insert (for now)
- **UPDATE** - Public update (for now)
- **DELETE** - Public delete (for now)

**Future:** Policies will be updated to require authentication when Supabase Auth is implemented.

## 📈 Performance Considerations

### Indexes

Indexes are created on:
- Foreign keys
- Frequently queried columns
- Composite indexes for common query patterns

### Query Optimization

- Use `SELECT` with specific columns (not `*`)
- Leverage indexes for filtering
- Use `LIMIT` for pagination (future enhancement)

## 🔄 Migration Strategy

### Schema Files

- `complete_schema.sql` - Complete schema for fresh setup
- `schema.sql` - Main schema
- `templates_schema.sql` - Templates table
- `versioning_schema.sql` - Versioning system
- `files_schema.sql` - File system
- `migration_application_groups.sql` - Application groups

### Running Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy and paste migration SQL
4. Run query
5. Verify tables/indexes created

## 📚 Related Documentation

- [Architecture Overview](OVERVIEW.md) - High-level architecture
- [Component Architecture](COMPONENTS.md) - Component structure
- [Development Guide](../DEVELOPMENT/GUIDE.md) - Development workflow

---

**Last Updated**: 2025-01-30

