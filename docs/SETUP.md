# DocHub - Complete Setup Guide

This guide provides detailed, step-by-step instructions for setting up DocHub from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Bun** (v1.0 or higher) - [Installation Guide](https://bun.sh/docs/installation)
- **Git** - For cloning the repository
- **Supabase Account** - [Sign up for free](https://supabase.com)
- **Text Editor** - VS Code, WebStorm, or your preferred editor

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd DLWait
```

### Step 2: Install Dependencies

```bash
bun install
```

This will install all required packages:
- Next.js and React dependencies
- Supabase client libraries
- Tiptap editor and extensions
- Tailwind CSS and utilities
- TypeScript types

### Step 3: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name (e.g., "DocHub")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to initialize (2-3 minutes)

### Step 4: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...` - keep this secret!)

### Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Create the file
touch .env.local
```

Add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important:**
- Never commit `.env.local` to version control
- The `.env.local` file should already be in `.gitignore`
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret

### Step 6: Set Up Database Schema

You have two options depending on your situation:

#### Option A: Fresh Setup (Recommended)

If you're setting up a new database or want to start fresh:

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Open `supabase/complete_schema.sql` in your editor
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **"Run"**

**⚠️ Warning:** This will delete all existing data if tables already exist.

This single script creates:
- All tables (teams, applications, documents, templates, versions)
- All indexes for performance
- All triggers for automatic timestamp updates
- All functions for versioning
- Complete schema structure

#### Option B: Incremental Setup

If you already have data and want to add features incrementally:

Run these SQL files in order in Supabase SQL Editor:

1. **`supabase/schema.sql`**
   - Creates main tables: teams, applications, base_documents, team_documents
   - Sets up foreign keys and indexes

2. **`supabase/templates_schema.sql`**
   - Creates document_templates table
   - Sets up template relationships

3. **`supabase/versioning_schema.sql`**
   - Creates document_versions table
   - Sets up versioning triggers and functions

4. **`supabase/rls_policies.sql`**
   - Creates Row Level Security policies
   - Sets up access control

### Step 7: Configure Supabase Storage

Images uploaded in documents need to be stored in Supabase Storage.

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `documents`
   - **Public bucket**: ✅ **Enable** (checked)
   - **File size limit**: 5MB (or your preference)
   - **Allowed MIME types**: `image/*` (or leave empty for all)
4. Click **"Create bucket"**

#### Set Storage Policies

Go to Supabase Dashboard → **Storage** → **Policies** → Select `documents` bucket

Create a new policy for public read access:

1. Click **"New Policy"**
2. Choose **"For full customization"**
3. Policy name: `Allow public read access`
4. Policy definition:
   ```sql
   (bucket_id = 'documents')
   ```
5. Allowed operations: ✅ **SELECT**
6. Target roles: `public`
7. Click **"Review"** then **"Save policy"**

Create a policy for authenticated uploads:

1. Click **"New Policy"** again
2. Policy name: `Allow authenticated upload`
3. Policy definition:
   ```sql
   (bucket_id = 'documents')
   ```
4. Allowed operations: ✅ **INSERT**
5. Target roles: `authenticated` (or `public` if you want anyone to upload)
6. Click **"Save policy"**

Alternatively, you can run this SQL in the SQL Editor:

```sql
-- Allow public read access to documents bucket
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');
```

### Step 8: Seed the Database

Populate the database with sample data:

```bash
bun run seed
```

This script creates:
- **3 Teams**: Application, Systems, Support
- **2 Applications**: test-app-1, test-app-2
- **Base Documents**: 4 documents (shared across teams)
- **Team Documents**: 6 documents (team-specific)
- **Templates**: 6 predefined templates

**Expected output:**
```
🌱 Starting database seed...

✅ Database seeded successfully!
📊 Summary:
   • 2 applications
   • 4 base documents
   • 3 teams
   • 6 team documents
   • 6 document templates
```

### Step 9: Verify Setup

Run the database validation script:

```bash
bun run validate
```

This checks:
- Database connection
- Tables exist
- Sample data is present
- Relationships are correct

### Step 10: Start Development Server

```bash
bun run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Homepage loads without errors
- [ ] Team selector shows 3 teams
- [ ] Application cards display (2 applications)
- [ ] Can view documents
- [ ] Can create new documents
- [ ] Can edit documents
- [ ] Can delete documents
- [ ] Search functionality works
- [ ] Templates appear when creating documents
- [ ] Can upload images in editor

## 🐛 Troubleshooting

### Database Connection Errors

**Error**: "Missing Supabase environment variables"

**Solution**:
- Verify `.env.local` exists in project root
- Check all three environment variables are set
- Restart development server after changing `.env.local`

**Error**: "Failed to fetch" or connection timeout

**Solution**:
- Verify Supabase project is active (not paused)
- Check project URL is correct
- Verify network connectivity
- Run `bun run check-db` to test connection

### Schema Setup Issues

**Error**: "relation already exists"

**Solution**:
- If using Option A (`complete_schema.sql`), it handles drops automatically
- If using Option B, check which tables already exist
- Drop existing tables manually if needed, or use Option A

**Error**: "function already exists"

**Solution**:
- The complete schema handles this, but if using incremental:
- Drop functions manually: `DROP FUNCTION IF EXISTS function_name CASCADE;`

### Storage Issues

**Error**: Images not uploading

**Solution**:
- Verify `documents` bucket exists
- Check bucket is set to Public
- Verify storage policies are created
- Check browser console for specific errors

**Error**: Images not displaying

**Solution**:
- Verify image URLs are accessible
- Check bucket is public
- Verify storage policies allow SELECT
- Check image file format is supported

### Seed Script Issues

**Error**: "No teams were created"

**Solution**:
- Verify database schema is set up first
- Check environment variables are correct
- Verify Supabase service role key has permissions
- Check Supabase project is not paused

**Error**: Foreign key constraint violations

**Solution**:
- Ensure all parent tables exist (teams, applications)
- Run schemas in correct order
- Check foreign key relationships are correct

## 📚 Next Steps

After setup is complete:

1. **Explore the Application**: Try creating, editing, and viewing documents
2. **Read Documentation**: Check `docs/README.md` for complete docs
3. **Customize Templates**: Add your own templates (see `docs/RICH_TEXT_EDITOR.md`)
4. **Review Roadmap**: See `docs/ROADMAP.md` for planned features

## 🔗 Related Documentation

- [Quick Start Guide](QUICK_START.md) - Fast setup for experienced developers
- [Development Guide](DEVELOPMENT.md) - Developer workflow and best practices
- [Rich Text Editor Setup](RICH_TEXT_EDITOR.md) - Detailed editor configuration
- [Testing Guide](TESTING.md) - Testing procedures and validation

---

**Need help?** Check the troubleshooting section above or review the main [README](../README.md).

