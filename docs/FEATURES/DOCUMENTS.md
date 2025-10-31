# Document Management

**Status**: ✅ Complete  
**Last Updated**: 2025-01-30

---

## Overview

DocHub provides comprehensive document management including creation, editing, viewing, versioning, and export capabilities.

---

## Core Features

### ✅ Document Creation

- Rich text editor with formatting options
- Document metadata (title, category, document type, tags)
- Tag assignment during creation
- Application association
- Base documents (shared) and Team documents

**Components**:
- `NewDocumentDialog` - Document creation form
- `TagSelector` - Tag selection with autocomplete
- Rich text editor integration

### ✅ Document Editing

- Inline editing with rich text editor
- Document metadata editing
- Tag management (add/remove tags)
- Document type switching (base ↔ team)
- Category updates

**Components**:
- `DocumentMetadataEditor` - Edit title, category, type, tags
- `DocumentViewer` - View and edit document content

### ✅ Document Viewing

- HTML rendering of document content
- Document metadata display
- Version history viewing
- File attachments display
- Breadcrumb navigation
- Responsive design

**Features**:
- Print functionality
- Export to PDF and Markdown
- Shareable link generation
- Print-optimized styling

### ✅ Document Versioning

- Version history tracking
- Version restoration
- Automatic version creation on edits
- Version comparison (if implemented)

### ✅ Document Tags

- Tag-based organization
- Tag filtering in search
- Tag creation (admin only, or via UI)
- Tag display in document viewer
- Tag autocomplete in tag selector

**Implementation**:
- Tags stored in `tags` table
- Document-tag relationships in `document_tags` table
- Tag filtering integrated into search

---

## Document Types

### Base Documents

- **Shared Documents**: Visible across all teams
- **Use Case**: Organization-wide documentation
- **Access**: All authenticated users

### Team Documents

- **Team-Specific**: Visible only to team members
- **Use Case**: Team-specific documentation
- **Access**: Only team members

**Switching**: Documents can be converted between base and team types via metadata editor.

---

## File Attachments

Documents support file attachments:

- **Upload**: Multiple files per document
- **Supported Types**: PDF, DOCX, XLSX, PPTX, images, etc.
- **Viewing**: In-app viewing for common file types
- **Download**: Download files for offline viewing
- **Management**: Upload, delete, replace files

See [File Management](FILES.md) for details.

---

## Document Metadata

- **Title**: Document name
- **Category**: Document category (e.g., "Guide", "Reference")
- **Document Type**: Base (shared) or Team
- **Tags**: Multiple tags for organization
- **Application**: Associated application
- **Created/Updated**: Timestamps

---

## Search Integration

Documents are fully searchable:

- Full-text search across title and content
- Category filtering
- Application filtering
- Document type filtering
- Tag-based filtering

See [Search & Discovery](SEARCH.md) for details.

---

## Components

- `DocumentViewer` - Main document display component
- `DocumentMetadataEditor` - Metadata editing dialog
- `NewDocumentDialog` - Document creation dialog
- `TagSelector` - Tag selection component
- `TagDisplay` - Tag display component

---

## API Endpoints

- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/[id]` - Get document
- `PUT /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document
- `GET /api/documents/[id]/tags` - Get document tags
- `POST /api/documents/[id]/tags` - Add tags to document
- `DELETE /api/documents/[id]/tags` - Remove tags from document

---

## Related Documentation

- [Search & Discovery](SEARCH.md)
- [File Management](FILES.md)
- [Rich Text Editor Guide](guides/rich-text-editor.md)

