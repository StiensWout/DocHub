# DocHub - Rich Text Editor Setup Guide

## Installation

Run the following command to install dependencies:

```bash
bun install
```

This will install:
- `@tiptap/react` - React wrapper for Tiptap
- `@tiptap/starter-kit` - Essential extensions
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-link` - Link support
- `@tiptap/extension-placeholder` - Placeholder text

## Database Setup

### 1. Create Templates Table

Run the SQL from `supabase/templates_schema.sql` in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS document_templates (
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

### 2. Create Storage Bucket

In Supabase Dashboard:
1. Go to **Storage**
2. Click **New bucket**
3. Name it `documents`
4. Set it to **Public** (for image access)
5. Create bucket

### 3. Set Storage Policies

Run this SQL to allow public read access:

```sql
-- Allow public read access to documents bucket
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');
```

## Features Implemented

### ✅ Rich Text Editor
- **Bold** and *Italic* text formatting
- Headings (H1, H2, H3)
- Bullet and numbered lists
- Links
- Images (upload to Supabase Storage)
- Code blocks
- Tables
- Blockquotes

### ✅ Document Templates
- 6 predefined templates:
  - Meeting Notes
  - Project Plan
  - API Documentation
  - Bug Report
  - Runbook
  - Architecture Document
- Searchable template selector
- Category-based organization
- Custom templates can be added to database

### ✅ Document Management
- Create new documents
- Edit existing documents
- Delete documents
- View documents with HTML rendering
- Choose between team and base documents

## Usage

### Creating a Document

1. Click **"New Doc"** button in header
2. Select document type (Team or Base)
3. Enter title and category
4. (Optional) Select a template
5. Click **Create**

### Editing a Document

1. Click on any document to view it
2. Click the **Edit** button (pencil icon)
3. Use the toolbar to format text:
   - **Bold** / *Italic*
   - Lists
   - Links
   - Images
4. Click **Save** when done

### Adding Images

1. While editing, click the **Image** icon in toolbar
2. Select an image file
3. Image uploads to Supabase Storage
4. Image is inserted into document

## Custom Templates

To add custom templates:

1. Go to Supabase Dashboard → SQL Editor
2. Insert into `document_templates`:

```sql
INSERT INTO document_templates (name, description, content, category, application_id)
VALUES (
  'Template Name',
  'Description',
  '<h1>Your HTML content here</h1>',
  'Category',
  'app-id' -- optional
);
```

## Styling

Editor styles are in `app/globals.css`:
- `.ProseMirror` - Editor container
- `.prose` - Document viewer styles

Both are styled for dark mode.
