# Configuration Guide

Configuration instructions for environment variables, storage, and Supabase setup.

## 🔐 Environment Variables

### Required Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (for `SUPABASE_SERVICE_ROLE_KEY`)

### Security Notes

- **Never commit `.env.local`** - It should be in `.gitignore`
- **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - This has admin access
- Use different keys for development and production
- `NEXT_PUBLIC_` prefix means the variable is exposed to the browser

## 📦 Storage Setup

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `documents`
   - **Public bucket**: ✅ **Check this** (allows public read access)
   - **File size limit**: `50` MB (or your preference)
   - **Allowed MIME types**: Leave empty (allows all file types)

4. Click **"Create bucket"**

### Step 2: Set Storage Policies

**Option A: Via SQL Editor (Recommended)**

1. Go to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Run this SQL:

```sql
-- Allow public read access to documents bucket
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to upload (or public for now)
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to delete (or public for now)
CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');
```

**Option B: Via Dashboard**

1. Go to **Storage** → **Policies**
2. Select the `documents` bucket
3. Click **"New Policy"** for each policy below

**Policy 1: Public Read Access**
- Policy name: `Allow public read access`
- Definition: `(bucket_id = 'documents')`
- Allowed operations: ✅ **SELECT**
- Target roles: `public`

**Policy 2: Public Upload**
- Policy name: `Allow public upload`
- Definition: `(bucket_id = 'documents')`
- Allowed operations: ✅ **INSERT**
- Target roles: `public`

**Policy 3: Public Delete**
- Policy name: `Allow public delete`
- Definition: `(bucket_id = 'documents')`
- Allowed operations: ✅ **DELETE**
- Target roles: `public`

### Step 3: Verify Storage Setup

1. In Storage → Buckets, verify `documents` bucket exists
2. In Storage → Policies, verify all 3 policies are created
3. Test upload (optional):
   - Go to Storage → `documents` bucket
   - Try uploading a test file manually
   - Verify it appears in the bucket

### Storage Path Structure

Files are stored as:
```
documents/{team_id}/{application_id}/{document_id}/{file_id}_{file_name}
```

For application-level files:
```
documents/{team_id}/{application_id}/application/{file_id}_{file_name}
```

## 🔒 Row Level Security (RLS) Policies

### Application Management Policies

If you encounter "permission denied" errors when creating applications, run this SQL:

```sql
-- Allow insert for applications
CREATE POLICY "Allow public insert to applications" ON applications
  FOR INSERT WITH CHECK (true);

-- Allow update for applications
CREATE POLICY "Allow public update to applications" ON applications
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for applications
CREATE POLICY "Allow public delete to applications" ON applications
  FOR DELETE USING (true);
```

These policies are included in `supabase/rls_policies.sql` and should be applied automatically during schema setup.

## ⚙️ Database Configuration

### Database Schema Files

- `supabase/purge.sql` - Removes all database objects
- `supabase/create.sql` - Creates complete schema from scratch
- `supabase/database_dump.sql` - Current database schema (source of truth)

### Setting Up Database

**Fresh Setup:**
1. Run `supabase/purge.sql` to remove all existing objects (if needed)
2. Run `supabase/create.sql` to create the complete schema

**Using Database Dump:**
1. Run `supabase/database_dump.sql` in Supabase SQL Editor for the most up-to-date schema

## 📝 Next Steps

After configuration:

1. **Verify Setup**: Run `bun run validate` to check database connection
2. **Seed Database**: Run `bun run seed` to create sample data
3. **Start Development**: Run `bun run dev` to start the server

## 🐛 Common Issues

### Storage Policies Not Working

**Symptoms**: Files upload but can't be accessed

**Solution**:
- Verify bucket is set to **Public**
- Check policies target `public` role
- Verify policy definitions are correct

### RLS Policy Errors

**Symptoms**: "Permission denied" when creating/editing applications

**Solution**:
- Run RLS policies SQL from `supabase/rls_policies.sql`
- Or use the SQL provided in this guide
- Verify policies are created in Supabase Dashboard

### Environment Variables Not Loading

**Symptoms**: "Missing Supabase environment variables"

**Solution**:
- Restart development server after changing `.env.local`
- Verify file is in project root (not in subdirectory)
- Check variable names are exactly correct (case-sensitive)

---

**Related Documentation**: [Installation Guide](INSTALLATION.md) | [Architecture](../ARCHITECTURE/DATABASE.md)

