# DocHub - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
bun install
```

### Step 2: Set Up Environment Variables
Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Set Up Database
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql`
3. Run `supabase/templates_schema.sql`

### Step 4: Set Up Storage (for Images)
1. Go to Supabase Dashboard → Storage
2. Create bucket named `documents`
3. Set to **Public**
4. Add storage policies (see `docs/RICH_TEXT_EDITOR.md`)

### Step 5: Seed Database
```bash
bun run seed
```

### Step 6: Start Development Server
```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

## 📚 Common Tasks

### Creating a Document
1. Click **"New Doc"** button
2. Choose document type (Team or Base)
3. Enter title and category
4. (Optional) Select a template
5. Click **Create**

### Editing a Document
1. Click any document to view it
2. Click the **Edit** button (pencil icon)
3. Use toolbar to format text, add images, etc.
4. Click **Save**

### Adding Images
1. Open document in editor
2. Click **Image** icon in toolbar
3. Select image file
4. Image uploads automatically

### Using Templates
1. When creating document, click **"Select a template..."**
2. Browse or search templates
3. Select template to pre-fill content

## 🔧 Troubleshooting

### Images Not Uploading
- Check Supabase Storage bucket exists
- Verify bucket is set to Public
- Check storage policies are configured

### Templates Not Showing
- Ensure `document_templates` table exists
- Run `supabase/templates_schema.sql`
- Check database connection

### Database Errors
- Run `bun run check-db` to verify connection
- Ensure all schema files are run
- Check environment variables

## 📖 More Documentation

- **Full Setup**: See `README.md`
- **Rich Text Editor**: See `docs/RICH_TEXT_EDITOR.md`
- **Features**: See `docs/COMPLETED.md`
- **Roadmap**: See `docs/ROADMAP.md`

---

*Need help? Check the main README or documentation files.*
