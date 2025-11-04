-- ============================================================================
-- DocHub Database Schema Export Script (Simplified)
-- ============================================================================
-- Run this script in Supabase Dashboard → SQL Editor
-- Copy the output and save to: supabase/database_dump.sql
-- ============================================================================

-- Enable output formatting
\t on
\a on
\pset format aligned

-- ============================================================================
-- ENUMS
-- ============================================================================

\echo '-- ============================================================================'
\echo '-- ENUMS AND TYPES'
\echo '-- ============================================================================'
\echo ''

SELECT 
    'CREATE TYPE ' || quote_ident(t.typname) || ' AS ENUM (' ||
    string_agg(
        quote_literal(e.enumlabel),
        ', ' ORDER BY e.enumsortorder
    ) || ');' as "CREATE TYPE"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

\echo ''
\echo '-- ============================================================================'
\echo '-- TABLES'
\echo '-- ============================================================================'
\echo ''

-- Use pg_dump function to get table definitions
-- Note: This requires superuser privileges or you can use the Dashboard's export feature
-- For now, we'll output table structures manually

SELECT 
    'CREATE TABLE ' || quote_ident(table_schema) || '.' || quote_ident(table_name) || ' (' || E'\n' ||
    string_agg(
        '    ' || quote_ident(column_name) || ' ' || 
        CASE 
            WHEN data_type = 'USER-DEFINED' THEN quote_ident(udt_name)
            WHEN data_type = 'ARRAY' THEN quote_ident(substring(udt_name from 2)) || '[]'
            WHEN data_type = 'character varying' THEN 'varchar' || 
                 CASE WHEN character_maximum_length IS NOT NULL 
                     THEN '(' || character_maximum_length || ')'
                     ELSE ''
                 END
            WHEN data_type = 'character' THEN 'char' || 
                 CASE WHEN character_maximum_length IS NOT NULL 
                     THEN '(' || character_maximum_length || ')'
                     ELSE ''
                 END
            WHEN data_type = 'numeric' THEN 'numeric' ||
                 CASE 
                     WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL
                     THEN '(' || numeric_precision || ',' || numeric_scale || ')'
                     WHEN numeric_precision IS NOT NULL
                     THEN '(' || numeric_precision || ')'
                     ELSE ''
                 END
            ELSE data_type
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ',' || E'\n'
        ORDER BY ordinal_position
    ) || E'\n' || ');' as "CREATE TABLE"
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_schema, table_name
ORDER BY table_name;

\echo ''
\echo '-- ============================================================================'
\echo '-- PRIMARY KEYS'
\echo '-- ============================================================================'
\echo ''

SELECT 
    'ALTER TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(t.relname) ||
    ' ADD CONSTRAINT ' || quote_ident(c.conname) ||
    ' PRIMARY KEY (' || string_agg(quote_ident(a.attname), ', ' ORDER BY array_position(c.conkey, a.attnum)) || ');' as "ALTER TABLE"
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'p'
  AND n.nspname = 'public'
GROUP BY n.nspname, t.relname, c.conname
ORDER BY t.relname, c.conname;

\echo ''
\echo '-- ============================================================================'
\echo '-- FOREIGN KEYS'
\echo '-- ============================================================================'
\echo ''

SELECT 
    'ALTER TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(t.relname) ||
    ' ADD CONSTRAINT ' || quote_ident(c.conname) ||
    ' FOREIGN KEY (' || string_agg(quote_ident(a.attname), ', ' ORDER BY array_position(c.conkey, a.attnum)) || ')' ||
    ' REFERENCES ' || quote_ident(rn.nspname) || '.' || quote_ident(rt.relname) ||
    ' (' || string_agg(quote_ident(ra.attname), ', ' ORDER BY array_position(c.confkey, ra.attnum)) || ')' ||
    CASE 
        WHEN c.confdeltype = 'c' THEN ' ON DELETE CASCADE'
        WHEN c.confdeltype = 'r' THEN ' ON DELETE RESTRICT'
        WHEN c.confdeltype = 'n' THEN ' ON DELETE SET NULL'
        WHEN c.confdeltype = 'd' THEN ' ON DELETE SET DEFAULT'
        ELSE ''
    END || ';' as "ALTER TABLE"
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_class rt ON c.confrelid = rt.oid
JOIN pg_namespace rn ON rn.oid = rt.relnamespace
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute ra ON ra.attrelid = rt.oid AND ra.attnum = ANY(c.confkey)
WHERE c.contype = 'f'
  AND n.nspname = 'public'
GROUP BY n.nspname, t.relname, c.conname, rn.nspname, rt.relname, c.confdeltype
ORDER BY t.relname, c.conname;

\echo ''
\echo '-- ============================================================================'
\echo '-- INDEXES'
\echo '-- ============================================================================'
\echo ''

SELECT 
    indexdef || ';' as "CREATE INDEX"
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE 'pg_%'
  AND NOT EXISTS (
      SELECT 1 FROM pg_constraint c 
      WHERE c.conname = pg_indexes.indexname
  )
ORDER BY tablename, indexname;

\echo ''
\echo '-- ============================================================================'
\echo '-- TRIGGERS'
\echo '-- ============================================================================'
\echo ''

SELECT 
    'CREATE TRIGGER ' || quote_ident(trigger_name) ||
    ' ' || action_timing || ' ' || event_manipulation ||
    ' ON ' || quote_ident(event_object_schema) || '.' || quote_ident(event_object_table) ||
    CASE WHEN action_condition IS NOT NULL THEN ' WHEN ' || action_condition ELSE '' END ||
    ' EXECUTE FUNCTION ' || quote_ident(action_statement) || '();' as "CREATE TRIGGER"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '-- ============================================================================'
\echo '-- FUNCTIONS'
\echo '-- ============================================================================'
\echo ''

SELECT 
    pg_get_functiondef(oid) || ';' as "CREATE FUNCTION"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;

\echo ''
\echo '-- ============================================================================'
\echo '-- ROW LEVEL SECURITY POLICIES'
\echo '-- ============================================================================'
\echo ''

SELECT 
    'ALTER TABLE ' || quote_ident(schemaname) || '.' || quote_ident(tablename) ||
    ' ENABLE ROW LEVEL SECURITY;' as "ALTER TABLE"
FROM pg_tables
WHERE schemaname = 'public'
  AND EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = pg_tables.tablename
        AND n.nspname = pg_tables.schemaname
        AND c.relrowsecurity = true
  )
ORDER BY tablename;

SELECT 
    'CREATE POLICY ' || quote_ident(pol.polname) ||
    ' ON ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) ||
    ' FOR ' || 
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END ||
    CASE 
        WHEN pol.polqual IS NOT NULL THEN ' USING (' || pg_get_expr(pol.polqual, pol.polrelid) || ')'
        ELSE ''
    END ||
    CASE 
        WHEN pol.polwithcheck IS NOT NULL THEN ' WITH CHECK (' || pg_get_expr(pol.polwithcheck, pol.polrelid) || ')'
        ELSE ''
    END || ';' as "CREATE POLICY"
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;

\echo ''
\echo '-- ============================================================================'
\echo '-- Export complete! Copy output above to: supabase/database_dump.sql'
\echo '-- ============================================================================'

