# Supabase Storage Setup for File Upload System

Follow these steps to configure Supabase Storage for the file upload system.

## Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"** button
5. Configure the bucket:
   - **Name**: `documents`
   - **Public bucket**: ✅ **Check this** (allows public read access)
   - **File size limit**: `50` MB (or your preference)
   - **Allowed MIME types**: Leave empty (allows all file types) OR specify:
     ```
     application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,text/plain,text/markdown,image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/zip
     ```
6. Click **"Create bucket"**

## Step 2: Set Storage Policies

### Option A: Via SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Copy and paste the following SQL:

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

4. Click **"Run"**

### Option B: Via Dashboard

1. Go to **Storage** → **Policies**
2. Select the `documents` bucket
3. Click **"New Policy"**

**Policy 1: Public Read Access**
- Click **"For full customization"**
- Policy name: `Allow public read access`
- Definition: `(bucket_id = 'documents')`
- Allowed operations: ✅ **SELECT**
- Target roles: `public`
- Click **"Save policy"**

**Policy 2: Public Upload**
- Click **"New Policy"** again
- Policy name: `Allow public upload`
- Definition: `(bucket_id = 'documents')`
- Allowed operations: ✅ **INSERT**
- Target roles: `public`
- Click **"Save policy"**

**Policy 3: Public Delete**
- Click **"New Policy"** again
- Policy name: `Allow public delete`
- Definition: `(bucket_id = 'documents')`
- Allowed operations: ✅ **DELETE**
- Target roles: `public`
- Click **"Save policy"**

## Step 3: Verify Setup

1. In Storage → Buckets, verify `documents` bucket exists
2. In Storage → Policies, verify all 3 policies are created
3. Test upload (optional):
   - Go to Storage → `documents` bucket
   - Try uploading a test file manually
   - Verify it appears in the bucket

## Step 4: Run Database Schema

If you haven't already, run the database schema:

1. Go to **SQL Editor**
2. If using incremental setup, run `supabase/files_schema.sql`
3. If using complete setup, run `supabase/complete_schema.sql` (includes everything)

## Notes

- **Public bucket**: Makes files accessible via public URLs (required for viewing)
- **File size limit**: 50MB default (configurable)
- **MIME types**: Leave empty to allow all file types, or restrict for security
- **Storage path structure**: Files will be stored as:
  ```
  documents/{team_id}/{application_id}/{document_id}/{file_id}_{file_name}
  ```

## Troubleshooting

**Issue**: "Bucket not found"
- Verify bucket name is exactly `documents`
- Check bucket exists in Storage → Buckets

**Issue**: "Permission denied"
- Verify policies are created
- Check policies allow public access
- Verify bucket is set to Public

**Issue**: "File upload fails"
- Check file size is under limit
- Verify file type is allowed (if MIME types are restricted)
- Check browser console for specific errors

---

**Next Steps**: After completing this setup, you can test file uploads using the FileUploadButton component.

