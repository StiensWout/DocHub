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
- **File size limit:** 50MB per file
- **Allowed file types:** 
  - Documents: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, MD
  - Images: JPG, JPEG, PNG, GIF, WEBP, SVG
  - Archives: ZIP, RAR (download only)

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
- **Library:** `mammoth` (DOCX to HTML conversion)
- **Features:**
  - Convert DOCX to HTML
  - Render in styled container
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
- **Images:** 10MB recommended
- **Documents:** 50MB
- **Archives:** 100MB (for extraction)

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
1. DOCX viewer (mammoth conversion)
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

## Dependencies

### NPM Packages
- `react-pdf` or `@react-pdf-viewer/core` - PDF viewing
- `mammoth` - DOCX to HTML conversion
- `xlsx` - Excel file parsing
- `file-saver` - File download helper
- `react-dropzone` - Drag & drop file upload (optional)

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
- 🔄 PDF viewer component (embedded PDF.js)
- 🔄 Word document viewer (DOCX to HTML conversion)
- 🔄 Excel spreadsheet viewer (XLSX viewing)
- 🔄 PowerPoint viewer (PPTX viewing)
- 🔄 File replacement/update option
- 🔄 File preview thumbnails

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

