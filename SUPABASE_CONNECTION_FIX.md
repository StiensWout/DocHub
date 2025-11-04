# Getting the Correct Supabase Connection String

The error indicates DNS resolution failure. Supabase requires using the **connection pooler** for external connections (like `pg_dump`).

## Steps to Fix

1. **Go to Supabase Dashboard**:
   - Navigate to: https://supabase.com/dashboard/project/lovgyxfqjhvjrzfkgqyq/settings/database

2. **Get Connection Pooler String**:
   - Scroll to "Connection string" section
   - Select **"Connection pooling"** tab
   - Choose either:
     - **Session mode** (for `pg_dump`)
     - **Transaction mode** (also works)
   - Copy the connection string - it will look like:
     ```
     postgresql://postgres.lovgyxfqjhvjrzfkgqyq:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

3. **Update your `.env.local`**:
   ```env
   SUPABASE_DB_URL="postgresql://postgres.lovgyxfqjhvjrzfkgqyq:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
   ```

4. **Run the dump script again**:
   ```bash
   bun run dump-db
   ```

## Why This Happens

- Direct connections (`db.*.supabase.co`) require IP allowlisting
- Connection pooler (`pooler.supabase.com`) works without IP restrictions
- `pg_dump` needs the pooler for external connections

## Alternative: Manual Export

If connection issues persist, you can export the schema manually:
1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. Export the schema using Supabase Dashboard's export feature

