# Application Management RLS Policies

## Issue

When trying to create applications, you may encounter a "low level security error" or "permission denied" error. This is because Row Level Security (RLS) is enabled on the `applications` table, but INSERT/UPDATE/DELETE policies are missing.

## Solution

Run the following SQL in your Supabase SQL Editor to add the necessary RLS policies:

```sql
-- Allow insert for applications (public access for now)
CREATE POLICY "Allow public insert to applications" ON applications
  FOR INSERT WITH CHECK (true);

-- Allow update for applications
CREATE POLICY "Allow public update to applications" ON applications
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for applications
CREATE POLICY "Allow public delete to applications" ON applications
  FOR DELETE USING (true);
```

## Quick Fix

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the SQL above
5. Run the query

After running this SQL, the application creation should work without security errors.

## Alternative: Update Existing Policies File

If you're using the existing `supabase/rls_policies.sql` file, the policies have been added there as well. Run that file in Supabase SQL Editor.

## Future Security

Once authentication is implemented, these policies should be updated to require authentication:

```sql
-- Future: Require authentication
CREATE POLICY "Allow authenticated insert to applications" ON applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);
```

