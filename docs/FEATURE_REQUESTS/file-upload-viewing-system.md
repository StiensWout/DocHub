# Feature Request: File Upload & Viewing System

**Priority:** 1 (High)  
**Status:** ✅ Completed  
**Created:** 2025-01-30  
**Completed:** 2025-01-30

## Overview

Implement a comprehensive file upload and viewing system that allows users to attach files (PDF, DOCX, XLSX, PPTX, images, etc.) to documents and view them directly within the application without leaving the platform.

## Problem Statement

Currently, users can only create rich text documents with embedded images. There's no way to:
- Attach external files (PDFs, Word docs, spreadsheets, etc.)
- View these files within the application
- Organize files alongside documents
- Manage file versions independently

## Goals

1. **Enable file attachments** to documents
2. **Support multiple file types** (PDF, DOCX, XLSX, PPTX, images, etc.)
3. **In-app file viewing** for common file types
4. **File management** (upload, delete, replace, download)
5. **Seamless integration** with existing document workflow

## User Stories

### Upload & Storage
- **As a user**, I want to upload files to documents so I can attach reference materials
- **As a user**, I want to upload multiple files to a single document
- **As a user**, I want to see file metadata (name, size, type, upload date)
- **As a user**, I want file size limits to prevent abuse
- **As a user**, I want file validation to ensure only allowed file types are uploaded

### File Viewing
- **As a user**, I want to view PDFs directly in the app without downloading
- **As a user**, I want to view Word documents (DOCX) in the browser
- **As a user**, I want to view Excel spreadsheets (XLSX) in the browser
- **As a user**, I want to view PowerPoint presentations (PPTX) in the browser
- **As a user**, I want to view images in a full-screen gallery
- **As a user**, I want to download files that can't be viewed in-app

### File Management
- **As a user**, I want to see all files attached to a document
- **As a user**, I want to delete files I no longer need
- **As a user**, I want to replace/update files
- **As a user**, I want to download files for offline viewing
- **As a user**, I want to see file preview thumbnails in the file list

## Technical Requirements

### Database Schema

#### New Table: `document_files`
```sql
CREATE TABLE document_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('base', 'team')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL, -- MIME type
  file_size BIGINT NOT NULL, -- bytes
  storage_bucket TEXT NOT NULL DEFAULT 'documents',
  uploaded_by UUID REFERENCES auth.users(id), -- for future auth
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint handled in application logic
  -- (can't use FK because document_id references different tables)
);

CREATE INDEX idx_document_files_document ON document_files(document_id, document_type);
CREATE INDEX idx_document_files_uploaded_at ON document_files(uploaded_at DESC);
```

### Supabase Storage

#### Bucket: `documents`
- **Public access:** Read-only for viewing
- **Upload policy:** Authenticated users only (or public for now)
- **File size limit:** 50MB per file (configurable per file type)
- **Allowed file types:** 

  **Standard Documents:**
  - PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT
  - TXT, MD (Markdown)
  
  **Code Files:**
  - JavaScript/TypeScript: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`
  - Python: `.py`, `.pyw`, `.pyc`, `.pyo`
  - Java: `.java`, `.class`, `.jar`, `.war`
  - C/C++: `.c`, `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp`, `.hxx`
  - C#: `.cs`, `.csx`
  - Go: `.go`
  - Rust: `.rs`
  - Ruby: `.rb`, `.rbw`
  - PHP: `.php`, `.phtml`
  - Swift: `.swift`
  - Kotlin: `.kt`, `.kts`
  - Scala: `.scala`
  - R: `.r`, `.R`
  - Perl: `.pl`, `.pm`
  - Lua: `.lua`
  - Shell: `.sh`, `.bash`, `.zsh`, `.fish`
  - PowerShell: `.ps1`, `.psm1`, `.psd1`
  - Batch: `.bat`, `.cmd`
  
  **Configuration Files:**
  - JSON: `.json`, `.jsonc`
  - YAML: `.yaml`, `.yml`
  - XML: `.xml`, `.xsd`, `.xsl`
  - TOML: `.toml`
  - INI: `.ini`, `.cfg`, `.conf`
  - Environment: `.env`, `.env.local`, `.env.production`
  - Properties: `.properties`
  
  **Infrastructure & DevOps:**
  - Docker: `Dockerfile`, `.dockerignore`
  - Docker Compose: `docker-compose.yml`, `docker-compose.yaml`
  - Kubernetes: `.yaml`, `.yml` (manifests)
  - Terraform: `.tf`, `.tfvars`, `.tfstate`
  - Ansible: `.yaml`, `.yml` (playbooks)
  - CloudFormation: `.json`, `.yaml`, `.yml`, `.template`
  - Helm: `.yaml`, `.yml` (charts)
  - Vagrant: `Vagrantfile`
  - Packer: `.json`, `.hcl`
  
  **CI/CD:**
  - GitHub Actions: `.yml`, `.yaml` (workflows)
  - GitLab CI: `.gitlab-ci.yml`
  - Jenkins: `Jenkinsfile`, `.xml`
  - CircleCI: `.circleci/config.yml`
  - Azure DevOps: `.yml` (pipelines)
  
  **Database:**
  - SQL: `.sql`, `.psql`
  - SQLite: `.sqlite`, `.sqlite3`, `.db`
  - Database dumps: `.dump`, `.bak`
  
  **Data Formats:**
  - CSV: `.csv`
  - TSV: `.tsv`
  - Excel: `.xlsx`, `.xls`, `.xlsm`
  - Parquet: `.parquet`
  
  **Architecture & Design:**
  - DrawIO: `.drawio`, `.xml` (draw.io format)
  - PlantUML: `.puml`, `.plantuml`
  - Mermaid: `.mmd`, `.mermaid`
  - Graphviz: `.dot`, `.gv`
  - Lucidchart: `.lucid`
  
  **Images:**
  - Raster: JPG, JPEG, PNG, GIF, WEBP, BMP, TIFF, ICO
  - Vector: SVG, EPS
  - Diagrams: PNG, SVG (screenshots/diagrams)
  
  **Logs & Text:**
  - Log files: `.log`, `.txt` (log content)
  - README: `README.md`, `README.txt`
  - License: `LICENSE`, `LICENSE.txt`
  - Changelog: `CHANGELOG.md`, `CHANGELOG.txt`
  
  **Security & Certificates:**
  - Certificates: `.pem`, `.crt`, `.cer`, `.der`, `.p12`, `.pfx`
  - Keys: `.key`, `.pub`, `.pem`
  - SSH: `id_rsa`, `id_ed25519`, `authorized_keys`
  - OpenSSL: `.csr`, `.pem`
  
  **Special Formats:**
  - WebAssembly: `.wasm`, `.wat`
  - Fonts: `.ttf`, `.otf`, `.woff`, `.woff2`
  - Icons: `.ico`, `.icns`
  - Font Awesome: `.svg` (icons)
  
  **Documentation:**
  - Markdown: `.md`, `.markdown`
  - AsciiDoc: `.adoc`, `.asciidoc`
  - ReStructuredText: `.rst`
  - HTML: `.html`, `.htm`
  
  **Note:** Some file types may not have standard MIME types and will default to `application/octet-stream` or `text/plain`. The system should handle these gracefully.

#### Storage Structure
```
documents/
  {team_id}/
    {application_id}/
      {document_id}/
        {file_id}_{file_name}
```

### File Viewing Libraries

#### PDF Viewer
- **Library:** `react-pdf` or `@react-pdf-viewer/core`
- **Features:** 
  - Page navigation
  - Zoom controls
  - Full-screen mode
  - Download button

#### DOCX Viewer
- **Library:** `docx-preview` (DOCX rendering with formatting preservation)
- **Features:**
  - Render DOCX files directly in browser
  - Preserves fonts, colors, images, layout, and formatting
  - Better fidelity to original Word documents
  - Download original file

#### XLSX Viewer
- **Library:** `xlsx` + `react-data-grid` or custom table component
- **Features:**
  - Parse XLSX files
  - Display in sortable table
  - Multiple sheet support
  - Download original file

#### PPTX Viewer
- **Library:** `pptxgenjs` (reverse) or `officegen` + custom renderer
- **Alternative:** Convert to images server-side, display as slideshow
- **Features:**
  - Slide navigation
  - Full-screen mode
  - Download original file

#### Image Viewer
- **Library:** Custom gallery component
- **Features:**
  - Full-screen gallery
  - Zoom/pan
  - Lightbox with navigation
  - Download option

### API Endpoints

#### File Upload
- **Endpoint:** `/api/files/upload`
- **Method:** POST
- **Body:** FormData with file + document metadata
- **Response:** File metadata object

#### File List
- **Endpoint:** `/api/files?documentId={id}&documentType={type}`
- **Method:** GET
- **Response:** Array of file metadata

#### File Delete
- **Endpoint:** `/api/files/{fileId}`
- **Method:** DELETE
- **Response:** Success confirmation

#### File Download URL
- **Endpoint:** `/api/files/{fileId}/download`
- **Method:** GET
- **Response:** Signed URL for download

### Components

#### `FileUploadButton`
- Button/area for file upload
- Drag & drop support
- Multiple file selection
- Progress indicators
- File type validation
- Size limit checking

#### `FileList`
- Display attached files
- Show thumbnails/previews
- Show metadata (name, size, type, date)
- Actions: view, download, delete
- Empty state

#### `FileViewer`
- Modal/overlay for file viewing
- Type detection and appropriate viewer
- Navigation controls
- Download button
- Close button

#### `PDFViewer`
- PDF rendering
- Page controls
- Zoom controls
- Full-screen toggle

#### `DOCXViewer`
- DOCX to HTML conversion
- Styled rendering
- Download button

#### `XLSXViewer`
- Spreadsheet parsing
- Table display
- Sheet navigation
- Download button

#### `ImageGallery`
- Image display
- Lightbox mode
- Zoom/pan
- Navigation arrows

### File Size Limits

- **Default:** 50MB per file
- **Code files:** 10MB recommended (most code files are small)
- **Configuration files:** 5MB recommended (typically very small)
- **Documents:** 50MB
- **Images:** 10MB recommended
- **Database dumps:** 100MB (may need adjustment based on database size)
- **Log files:** 50MB (can be very large)

### File Type Validation Strategy

**Current Implementation:**
- Uses MIME type validation (`file.type` in browser)
- Some file types may not have standard MIME types
- Browser detection may be inconsistent

**Recommended Enhancement:**
- Use file extension as fallback validation
- Map file extensions to allowed types
- Support both MIME type and extension validation
- Allow `application/octet-stream` for unknown binary types with known extensions
- Allow `text/plain` for known text-based file types (code, config, etc.)

**Implementation Priority:**
1. **Phase 1 (Current):** Basic document and image types ✅
2. **Phase 2:** Add code file extensions (`.js`, `.py`, `.ts`, etc.)
3. **Phase 3:** Add configuration file extensions (`.json`, `.yaml`, `.env`, etc.)
4. **Phase 4:** Add infrastructure file extensions (`.tf`, `Dockerfile`, etc.)
5. **Phase 5:** Add remaining IT-specific types

**MIME Type Mapping:**
- Text files: `text/plain` (common for code/config files)
- Binary files: `application/octet-stream` (fallback for unknown types)
- Code files: Often detected as `text/plain` or `application/octet-stream`
- Configuration files: Often detected as `text/plain` or `application/json`
- Infrastructure files: Often detected as `text/plain` or `application/x-yaml`

### Error Handling

- File size exceeds limit
- Unsupported file type
- Upload failure
- Storage quota exceeded
- File not found
- Viewer error (fallback to download)

## Implementation Plan

### Phase 1: Foundation (Days 1-2)
1. Create database schema for `document_files`
2. Set up Supabase Storage bucket and policies
3. Create file upload API endpoint
4. Implement `FileUploadButton` component
5. Basic file list display

### Phase 2: Core Upload & Management (Days 3-4)
1. File upload to Supabase Storage
2. File metadata storage in database
3. File list component with metadata
4. File deletion functionality
5. File download functionality

### Phase 3: File Viewing - Basic (Days 5-6)
1. PDF viewer implementation
2. Image viewer/gallery
3. File viewer modal/overlay
4. Type detection and routing

### Phase 4: File Viewing - Advanced (Days 7-8)
1. DOCX viewer (docx-preview for formatting preservation)
2. XLSX viewer (table display)
3. PPTX viewer (basic implementation)
4. Generic download fallback

### Phase 5: Integration & Polish (Days 9-10)
1. Integrate file upload into document editor
2. Integrate file list into document viewer
3. Add file management to document actions
4. Error handling and user feedback
5. Loading states and progress indicators
6. Responsive design

### Phase 6: Testing & Documentation (Days 11-12)
1. Test all file types
2. Test upload/download flows
3. Test error scenarios
4. Performance testing
5. Update documentation
6. Update roadmap

### Implementation Notes

**File Type Detection Challenges:**
- Many IT file types don't have standard MIME types
- Browsers may report `application/octet-stream` or `text/plain` for code/config files
- File extension validation is more reliable for IT-specific files
- Consider implementing extension-based validation as primary check with MIME type as secondary

**Recommended File Validation Approach:**
```typescript
// Pseudo-code for improved validation
const ALLOWED_EXTENSIONS = [
  // Code files
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs',
  // Config files
  '.json', '.yaml', '.yml', '.xml', '.toml', '.ini', '.env', '.conf',
  // Infrastructure
  '.tf', '.tfvars', '.yaml', '.yml', // Terraform, Kubernetes, etc.
  // Add more as needed...
];

function isValidFile(file: File): boolean {
  // Check extension first
  const ext = getFileExtension(file.name);
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  // Then check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.type)) {
    return true;
  }
  
  // Allow text/plain for known text-based file types
  if (file.type === 'text/plain' && isTextBasedExtension(ext)) {
    return true;
  }
  
  return false;
}
```

**Security Considerations:**
- ⚠️ **Executable files:** Consider blocking `.exe`, `.dll`, `.deb`, `.rpm`, `.msi` unless explicitly needed
- ⚠️ **Script files:** `.sh`, `.ps1`, `.bat` files may need special handling or warnings
- ⚠️ **Certificate/Key files:** Should be stored securely, consider encryption
- ⚠️ **Database dumps:** May contain sensitive data, consider access controls
- ⚠️ **Environment files:** `.env` files often contain secrets, consider warnings or encryption

## Dependencies

### NPM Packages
- `react-pdf` - PDF viewing
- `docx-preview` - DOCX rendering with formatting preservation
- `xlsx` - Excel file parsing
- `file-saver` - File download helper
- `react-dropzone` - Drag & drop file upload (optional, currently using custom implementation)

### Supabase
- Storage bucket configured
- Storage policies set up
- RLS policies for file access

## Success Criteria

- ✅ Users can upload files to documents
- ✅ Users can view PDFs in-app
- ✅ Users can view DOCX files in-app
- ✅ Users can view images in-app
- ✅ Users can download any file
- ✅ Users can delete files
- ✅ File metadata is displayed correctly
- ✅ File size limits are enforced
- ✅ Error handling is user-friendly
- ✅ Integration with existing document workflow is seamless

## Future Enhancements

- File versioning (keep history of file updates)
- File search (search within files)
- OCR for scanned documents
- File comments/annotations
- Bulk file operations
- File sharing links
- File preview generation (server-side thumbnails)
- Advanced PPTX viewer with animations
- CSV viewer for CSV files
- Markdown viewer for MD files

## Risks & Considerations

1. **File Size:** Large files may slow down the app
   - **Mitigation:** Implement lazy loading, show file size warnings

2. **Storage Costs:** Supabase Storage has limits
   - **Mitigation:** Implement file size limits, consider cleanup policies

3. **Browser Compatibility:** Some viewers may not work in all browsers
   - **Mitigation:** Provide download fallback for unsupported formats

4. **Performance:** Converting large files client-side may be slow
   - **Mitigation:** Consider server-side conversion for large files

5. **Security:** File uploads can be a security risk
   - **Mitigation:** Validate file types, scan for malware (future), use signed URLs

## Questions to Resolve

- [ ] Should files be versioned independently of documents?
- [ ] Should file uploads be allowed for base documents (shared across teams)?
- [ ] What's the maximum number of files per document?
- [ ] Should we support file folders/organization?
- [ ] Do we need file sharing/permissions?

## Related Issues

- Document versioning system (already implemented)
- Authentication system (for file permissions)

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [react-pdf Documentation](https://react-pdf.org/)
- [mammoth Documentation](https://github.com/mwilliamson/mammoth.js)

---

**Note:** This feature request serves as a living document. Update as requirements evolve or new information becomes available.

---

## ✅ Implementation Summary

**Completed:** 2025-01-30

### Implemented Features

#### Core Functionality
- ✅ File upload to documents (`document_id` + `document_type`)
- ✅ File upload to applications (`application_id`)
- ✅ File storage in Supabase Storage (`documents` bucket)
- ✅ File metadata tracking in `document_files` table
- ✅ File validation (size limit: 50MB, type validation)
- ✅ Drag-and-drop file upload support
- ✅ Upload progress indicators

#### File Management
- ✅ File list display in document viewer
- ✅ Application files list component
- ✅ File download functionality (via Supabase Storage URLs)
- ✅ File deletion with confirmation
- ✅ File metadata display (name, size, type, visibility)
- ✅ File type icons

#### Database Schema
- ✅ `document_files` table with flexible relationships
  - Supports document-level files (`document_id` + `document_type`)
  - Supports application-level files (`application_id`)
  - Visibility control (`public` vs `team`)
  - File metadata (name, size, type, storage path)
- ✅ Indexes for performance optimization
- ✅ RLS policies for file access control
- ✅ Migration script for existing databases

#### UI Components
- ✅ `FileUploadButton` component (button and dropzone variants)
- ✅ `FileList` component for document files
- ✅ `ApplicationFileList` component for application files
- ✅ Visibility selector (public/team) for application files
- ✅ Integration with document editor and viewer

#### API Endpoints
- ✅ `POST /api/files/upload` - File upload handler
- ✅ `DELETE /api/files/[fileId]` - File deletion handler
- ✅ Storage cleanup on deletion
- ✅ Error handling and validation

### Future Enhancements
- 🔄 Excel spreadsheet viewer (XLSX viewing)
- 🔄 PowerPoint viewer (PPTX viewing)
- 🔄 File preview thumbnails
- 🔄 Enhanced DOCX editing capabilities

### Files Created/Modified
- `supabase/files_schema.sql` - File schema definition
- `supabase/migration_add_files_table.sql` - Migration script
- `supabase/complete_schema.sql` - Updated with file schema
- `types/index.ts` - Added `DocumentFile` and `FileUploadParams` types
- `lib/supabase/queries.ts` - Added file query functions
- `app/api/files/upload/route.ts` - Upload API endpoint
- `app/api/files/[fileId]/route.ts` - Delete API endpoint
- `components/FileUploadButton.tsx` - Upload component with drag-and-drop
- `components/FileList.tsx` - Document files list component
- `components/ApplicationFileList.tsx` - Application files list component
- `components/DocumentEditor.tsx` - Integrated file upload
- `components/DocumentViewer.tsx` - Integrated file list
- `app/page.tsx` - Added application-level file upload

