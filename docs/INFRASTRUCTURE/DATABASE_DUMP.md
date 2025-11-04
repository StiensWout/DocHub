# Database Dump Guide

This guide explains how to create a database dump that serves as the source of truth for all database documentation.

## Overview

The database dump (`supabase/database_dump.sql`) contains the complete schema and structure of the current Supabase database. This dump should be used as the authoritative source for all database-related documentation.

## Creating a Database Dump

### Method 1: Using the Dump Script (Recommended)

The easiest way to create a database dump is using the provided script:

1. **Set up environment variables**:
   ```bash
   # Option 1: Direct connection string (recommended)
   SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
   
   # Option 2: Construct from Supabase URL
   NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
   SUPABASE_DB_PASSWORD="[YOUR_DB_PASSWORD]"
   ```

2. **Install PostgreSQL client tools** (if not already installed):
   - **Windows**: Download from [PostgreSQL downloads](https://www.postgresql.org/download/windows/)
   - **Mac**: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql-client`

3. **Run the dump script**:
   ```bash
   bun run dump-db
   ```

   The script will:
   - Prefer `pg_dump` (no Docker required, more reliable)
   - Fall back to Supabase CLI if `pg_dump` is not available
   - Create `supabase/database_dump.sql` automatically

### Method 2: Using pg_dump Directly (Recommended)

If you have PostgreSQL client tools installed, you can use `pg_dump` directly:

1. **Get connection string** from Supabase Dashboard:
   - Go to Settings → Database
   - Copy the connection string under "Connection string" → "URI"

2. **Run pg_dump**:
   ```bash
   pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
     --schema=public \
     --schema-only \
     --no-owner \
     --no-privileges \
     --no-tablespaces \
     > supabase/database_dump.sql
   ```

### Method 3: Using Supabase CLI

**Note**: Supabase CLI requires Docker Desktop, which may not be ideal for remote dumps.

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Ensure Docker Desktop is running**

3. **Create dump**:
   ```bash
   supabase db dump --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
     --schema public \
     -f supabase/database_dump.sql
   ```

## Using the Dump

### For Documentation

- Reference `supabase/database_dump.sql` when documenting database structure
- Update documentation when schema changes
- Include relevant sections from the dump in documentation files

### For Development

- Use the dump to understand current database state
- Compare dump with schema files to identify discrepancies
- Use dump as reference when writing migrations

## Updating Documentation

When the database schema changes:

1. Create a new dump using one of the methods above
2. Review changes in the dump
3. Update relevant documentation files:
   - `docs/ARCHITECTURE/DATABASE.md`
   - `docs/GETTING_STARTED/SUPABASE_SETUP.md`
   - Any feature-specific documentation

## File Location

The database dump should be located at:
```
supabase/database_dump.sql
```

## Important Notes

- **Never commit sensitive data**: The dump should contain schema only, not data
- **Keep in sync**: Update the dump whenever schema changes
- **Version control**: Commit the dump to track schema changes over time
- **Documentation source**: All database documentation should reference this dump

## Related Documentation

- [Supabase Setup](GETTING_STARTED/SUPABASE_SETUP.md)
- [Database Architecture](ARCHITECTURE/DATABASE.md)
- [Development Guide](DEVELOPMENT/GUIDE.md)

