# File Management

**Status**: ✅ Complete  
**Last Updated**: 2025-01-30

---

## Overview

DocHub supports file attachments to documents, enabling users to attach reference materials (PDFs, Word docs, spreadsheets, presentations, images, etc.) and view them directly within the application.

---

## Features

### ✅ File Upload

- **Multiple Files**: Attach multiple files to a single document
- **File Types**: PDF, DOCX, XLSX, PPTX, images (JPG, PNG, GIF, etc.), and more
- **Size Limits**: Configurable file size limits
- **Validation**: File type validation on upload
- **Metadata**: File name, size, type, upload date tracking

### ✅ In-App File Viewing

Files can be viewed directly in the browser without downloading:

- **PDFs**: Embedded PDF viewer
- **Word Documents**: DOCX viewing (via viewer)
- **Spreadsheets**: XLSX viewing (via viewer)
- **Presentations**: PPTX viewing (via viewer)
- **Images**: Full-screen gallery with navigation
- **Unsupported**: Download option for unsupported file types

### ✅ File Management

- **List Files**: View all files attached to a document
- **Delete Files**: Remove files no longer needed
- **Replace Files**: Update files with newer versions
- **Download Files**: Download files for offline viewing
- **File Previews**: Thumbnail previews in file list

---

## Storage

Files are stored in Supabase Storage:

- **Bucket**: `files` (or configured bucket)
- **Organization**: Files organized by document ID
- **Access Control**: Team-based access control
- **Storage Backend**: Supabase Storage

---

## API Endpoints

- `POST /api/files` - Upload file
- `GET /api/files/[fileId]` - Get file metadata
- `GET /api/files/[fileId]/download` - Download file
- `DELETE /api/files/[fileId]` - Delete file
- `GET /api/documents/[documentId]/files` - List document files

---

## File Types Supported

### Viewable In-App
- PDF (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
- Word Documents (`.docx`) - via viewer
- Excel Spreadsheets (`.xlsx`) - via viewer
- PowerPoint Presentations (`.pptx`) - via viewer

### Download Only
- Other file types not directly viewable in browser

---

## Components

- File upload component in document viewer
- File list display in document viewer
- File viewer modal for viewing files
- Image gallery component

---

## Related Documentation

- [Document Management](DOCUMENTS.md)

