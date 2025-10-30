# DocHub - Quick Start Guide

Get DocHub up and running in 5 minutes. Perfect for experienced developers who want to get started quickly.

## ⚡ 5-Minute Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from: Supabase Dashboard → Settings → API

### 3. Set Up Database

**Option A: Fresh Setup (Recommended)**
- Go to Supabase Dashboard → SQL Editor
- Run `supabase/complete_schema.sql`

**Option B: Incremental Setup**
- Run in order: `schema.sql`, `templates_schema.sql`, `versioning_schema.sql`, `rls_policies.sql`

### 4. Configure Storage

- Supabase Dashboard → Storage
- Create bucket: `documents`
- Set to **Public**
- Add storage policies (see below)

**Quick Storage Policy SQL:**
```sql
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');
  
CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');
```

### 5. Seed Database

```bash
bun run seed
```

### 6. Start Development Server

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

## 🎯 Common Tasks

### Creating a Document

1. Click **"New Doc"** button in header
2. Choose document type:
   - **Team Document**: Visible only to current team
   - **Base Document**: Shared across all teams
3. Enter title and category
4. (Optional) Click **"Select a template..."** to choose a template
5. Click **Create**
6. Edit in rich text editor

### Editing a Document

1. Click any document to view it
2. Click **Edit** button (pencil icon)
3. Use toolbar to format:
   - **Bold** / *Italic*
   - Headings (H1, H2, H3)
   - Lists (bullet, numbered)
   - Links
   - Images
   - Tables
   - Code blocks
4. Click **Save** when done

### Adding Images

1. Open document in editor
2. Click **Image** icon in toolbar
3. Select image file (JPG, PNG, GIF)
4. Image uploads automatically to Supabase Storage
5. Image appears in document

### Using Templates

1. When creating document, click **"Select a template..."**
2. Browse or search templates:
   - Meeting Notes
   - Project Plan
   - API Documentation
   - Bug Report
   - Runbook
   - Architecture Document
3. Select template to pre-fill content
4. Customize as needed

### Searching Documents

1. Use search bar at top of page
2. Type to search across:
   - Document titles
   - Categories
   - Content
3. Filter results by:
   - Application
   - Category
   - Document type (Base/Team/All)
4. Click result to view document

### Viewing Version History

1. Open any document
2. Click **Version History** button
3. Browse all versions
4. View changes between versions
5. Restore previous version if needed

## 🔧 Troubleshooting

### Images Not Uploading

**Symptoms**: Images don't appear after upload

**Solutions**:
- ✅ Check `documents` bucket exists in Supabase Storage
- ✅ Verify bucket is set to **Public**
- ✅ Check storage policies are configured
- ✅ Verify file size is under limit (default: 5MB)
- ✅ Check browser console for errors

### Templates Not Showing

**Symptoms**: Template selector is empty or templates missing

**Solutions**:
- ✅ Ensure `document_templates` table exists
- ✅ Run `supabase/templates_schema.sql` if needed
- ✅ Verify seed script ran successfully: `bun run seed`
- ✅ Check database connection: `bun run check-db`

### Database Errors

**Symptoms**: "Failed to fetch" or connection errors

**Solutions**:
- ✅ Verify environment variables in `.env.local`
- ✅ Check Supabase project is active (not paused)
- ✅ Run `bun run check-db` to test connection
- ✅ Verify all schema files are run
- ✅ Restart development server after changing `.env.local`

### Search Not Working

**Symptoms**: Search returns no results or errors

**Solutions**:
- ✅ Verify documents exist in database
- ✅ Check search query is not empty
- ✅ Try different search terms
- ✅ Check browser console for errors
- ✅ Verify database connection is working

### Documents Not Loading

**Symptoms**: Documents don't appear or load slowly

**Solutions**:
- ✅ Check database connection: `bun run validate`
- ✅ Verify RLS policies are configured
- ✅ Check team is selected
- ✅ Verify documents exist for selected team
- ✅ Check browser console for errors

## 📚 Scripts Reference

```bash
# Development
bun run dev          # Start dev server (http://localhost:3000)
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run linter

# Database
bun run seed         # Seed database with sample data
bun run validate     # Validate database setup
bun run check-db     # Test database connection
```

## 🚀 Next Steps

Now that you're set up:

1. **Explore Features**: Try creating, editing, and searching documents
2. **Read Full Docs**: Check `docs/README.md` for complete documentation
3. **Customize**: Add your own templates and customize the app
4. **Check Roadmap**: See `docs/ROADMAP.md` for upcoming features

## 📖 More Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guide
- **[RICH_TEXT_EDITOR.md](RICH_TEXT_EDITOR.md)** - Rich text editor details
- **[COMPLETED.md](COMPLETED.md)** - List of features
- **[ROADMAP.md](ROADMAP.md)** - Product roadmap

---

**Need more help?** Check the [complete setup guide](SETUP.md) or [main README](../README.md).
