# DocHub - Rich Text Editor Setup Guide

Complete guide for setting up and using the Tiptap rich text editor in DocHub.

## 📦 Installation

All required dependencies are included in `package.json`. Install with:

```bash
bun install
```

### Installed Packages

- `@tiptap/react` - React wrapper for Tiptap editor
- `@tiptap/starter-kit` - Essential extensions (bold, italic, headings, lists, etc.)
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-link` - Link support
- `@tiptap/extension-placeholder` - Placeholder text

## 🗄️ Database Setup

### Templates Table

The `document_templates` table is created by:

- **Option A**: Running `supabase/complete_schema.sql` (includes everything)
- **Option B**: Running `supabase/templates_schema.sql` separately

The table structure:

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

## 💾 Storage Setup

### Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `documents`
   - **Public bucket**: ✅ **Enable** (checked)
   - **File size limit**: 5MB (recommended)
   - **Allowed MIME types**: `image/*` (or leave empty for all)
4. Click **"Create bucket"**

### Storage Policies

Create policies to allow public read access and authenticated uploads.

#### Via SQL Editor (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Allow public read access to documents bucket
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');
```

#### Via Dashboard

1. Go to **Storage** → **Policies** → Select `documents` bucket
2. Click **"New Policy"**
3. Select **"For full customization"**
4. Create policy:
   - **Name**: `Allow public read access`
   - **Definition**: `(bucket_id = 'documents')`
   - **Allowed operations**: ✅ SELECT
   - **Target roles**: `public`
5. Repeat for upload policy:
   - **Name**: `Allow authenticated upload`
   - **Definition**: `(bucket_id = 'documents')`
   - **Allowed operations**: ✅ INSERT
   - **Target roles**: `authenticated` or `public`

## ✨ Features

### Text Formatting

- **Bold** (`Ctrl+B` / `Cmd+B`)
- *Italic* (`Ctrl+I` / `Cmd+I`)
- Headings (H1, H2, H3)
- Bullet lists
- Numbered lists
- Blockquotes
- Code blocks
- Tables

### Links

- Insert hyperlinks
- Edit existing links
- Remove links
- Open in new tab option

### Images

- Upload images to Supabase Storage
- Drag and drop support
- Responsive image display
- Image alignment (coming soon)

### Editor Features

- Placeholder text
- Dark mode optimized styling
- Keyboard shortcuts
- Toolbar with formatting options
- Real-time editing
- Auto-save (via document save)

## 🎯 Usage

### Creating a Document with Template

1. Click **"New Doc"** button
2. Select document type (Team or Base)
3. Enter title and category
4. (Optional) Click **"Select a template..."**
5. Browse or search templates
6. Select template to pre-fill content
7. Click **Create**
8. Edit in rich text editor

### Editing a Document

1. Click on any document to view it
2. Click **Edit** button (pencil icon)
3. Use toolbar to format text:
   - Click formatting buttons
   - Use keyboard shortcuts
   - Insert images, links, tables
4. Click **Save** when done

### Toolbar Options

- **Bold** (`B`) - Make text bold
- **Italic** (`I`) - Make text italic
- **Heading** (`H1`, `H2`, `H3`) - Add headings
- **List** (`•`, `1.`) - Add bullet or numbered list
- **Link** (`🔗`) - Insert/edit link
- **Image** (`🖼️`) - Upload and insert image
- **Table** (`⊞`) - Insert table
- **Code** (`<>`) - Add code block
- **Quote** (`"`) - Add blockquote

### Adding Images

1. While editing, click **Image** icon in toolbar
2. Select image file from your computer
3. Image uploads automatically to Supabase Storage
4. Image appears in document
5. Image URL is stored in document content

**Supported formats**: JPG, PNG, GIF, WebP

**File size limit**: 5MB (configurable in bucket settings)

### Adding Links

1. Select text you want to link
2. Click **Link** icon in toolbar
3. Enter URL
4. Click **Save**
5. Link is created

To edit a link:
1. Click on the linked text
2. Click **Link** icon again
3. Modify URL or remove link

## 📋 Templates

### Predefined Templates

The seed script creates 6 templates:

1. **Meeting Notes** - Template for meeting minutes
2. **Project Plan** - Template for project planning
3. **API Documentation** - Template for API docs
4. **Bug Report** - Template for bug reporting
5. **Runbook** - Template for operational runbooks
6. **Architecture Document** - Template for architecture docs

### Custom Templates

#### Adding via SQL

Insert directly into database:

```sql
INSERT INTO document_templates (name, description, content, category, application_id)
VALUES (
  'Template Name',
  'Template description',
  '<h1>Your HTML content here</h1><p>More content...</p>',
  'Category Name',
  'app-id' -- optional, null for all applications
);
```

#### Adding via Seed Script

Edit `lib/supabase/seed.ts` and add to templates array:

```typescript
const templates = [
  // ... existing templates
  {
    name: "Your Template Name",
    description: "Template description",
    category: "Category",
    content: `<h1>Your HTML content</h1>`,
  },
];
```

Then run: `bun run seed`

### Template Features

- **Searchable**: Search templates by name or description
- **Categorized**: Organize by category
- **Application-specific**: Link templates to specific applications
- **HTML content**: Templates use HTML for rich formatting

## 🎨 Styling

### Editor Styles

Editor styles are in `app/globals.css`:

```css
.ProseMirror {
  /* Editor container styles */
  min-height: 200px;
  padding: 1rem;
}

.ProseMirror:focus {
  /* Focus styles */
  outline: none;
}

.ProseMirror img {
  /* Image styles */
  max-width: 100%;
  height: auto;
}
```

### Viewer Styles

Document viewer uses `.prose` class:

```css
.prose {
  /* Document viewer styles */
  max-width: none;
  color: inherit;
}
```

### Dark Mode

Both editor and viewer are styled for dark mode:
- Dark background colors
- Light text colors
- Proper contrast ratios
- Styled scrollbars

## 🔧 Configuration

### Changing Upload Limits

Edit bucket settings in Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Click on `documents` bucket
3. Edit **File size limit**
4. Save changes

### Adding New Extensions

To add new Tiptap extensions:

1. Install extension:
   ```bash
   bun add @tiptap/extension-name
   ```

2. Import in `components/DocumentEditor.tsx`:
   ```typescript
   import ExtensionName from '@tiptap/extension-name';
   ```

3. Add to extensions array:
   ```typescript
   extensions: [
     StarterKit,
     Image,
     Link,
     Placeholder,
     ExtensionName.configure({ /* options */ }),
   ]
   ```

4. Add toolbar button if needed

## 🐛 Troubleshooting

### Images Not Uploading

**Issue**: Images fail to upload or don't appear

**Solutions**:
- ✅ Verify `documents` bucket exists
- ✅ Check bucket is set to Public
- ✅ Verify storage policies are configured
- ✅ Check file size is under limit
- ✅ Verify image format is supported
- ✅ Check browser console for errors

### Templates Not Loading

**Issue**: Templates don't appear in selector

**Solutions**:
- ✅ Verify `document_templates` table exists
- ✅ Check seed script ran successfully
- ✅ Verify database connection
- ✅ Check template data exists in database

### Formatting Not Working

**Issue**: Formatting buttons don't apply styles

**Solutions**:
- ✅ Verify Tiptap extensions are installed
- ✅ Check editor is initialized correctly
- ✅ Verify content is being saved correctly
- ✅ Check browser console for errors

### Links Not Working

**Issue**: Links don't open or format incorrectly

**Solutions**:
- ✅ Verify Link extension is installed
- ✅ Check URL format is correct
- ✅ Verify link is saved in HTML format
- ✅ Check link rendering in viewer

## 📚 Resources

- [Tiptap Documentation](https://tiptap.dev/docs)
- [Tiptap React Guide](https://tiptap.dev/docs/react/guide)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-policies)

---

**Need more help?** Check [SETUP.md](SETUP.md) for complete setup instructions or [DEVELOPMENT.md](DEVELOPMENT.md) for developer guide.
