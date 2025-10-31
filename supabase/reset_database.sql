-- ============================================================================
-- DocHub Complete Database Reset Script
-- ============================================================================
-- This script COMPLETELY DROPS and RECREATES the entire database schema
-- WARNING: This will DELETE ALL DATA in ALL tables!
-- 
-- Use this script when you need to:
-- - Reset the database to a clean state
-- - Update the schema structure
-- - Fix schema inconsistencies
-- - Start fresh with test data
--
-- BEFORE RUNNING:
-- 1. BACKUP your data if needed (export to SQL or use Supabase backup)
-- 2. Ensure you have access to Supabase SQL Editor with admin privileges
-- 3. Note: This will also remove any custom RLS policies you've added
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (in reverse dependency order)
-- ============================================================================

-- Drop all triggers first (they depend on tables and functions)
DROP TRIGGER IF EXISTS create_initial_team_version ON team_documents CASCADE;
DROP TRIGGER IF EXISTS create_initial_base_version ON base_documents CASCADE;
DROP TRIGGER IF EXISTS create_team_document_version ON team_documents CASCADE;
DROP TRIGGER IF EXISTS create_base_document_version ON base_documents CASCADE;
DROP TRIGGER IF EXISTS update_team_documents_updated_at ON team_documents CASCADE;
DROP TRIGGER IF EXISTS update_base_documents_updated_at ON base_documents CASCADE;
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications CASCADE;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams CASCADE;
DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates CASCADE;
DROP TRIGGER IF EXISTS update_document_files_updated_at ON document_files CASCADE;
DROP TRIGGER IF EXISTS update_user_groups_updated_at ON user_groups CASCADE;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles CASCADE;

-- Drop policies (they depend on tables)
DROP POLICY IF EXISTS "Users can view their own groups" ON user_groups CASCADE;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles CASCADE;
DROP POLICY IF EXISTS "Admins can view all user groups" ON user_groups CASCADE;
DROP POLICY IF EXISTS "Admins can manage user groups" ON user_groups CASCADE;
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles CASCADE;
DROP POLICY IF EXISTS "Users can view document access groups" ON document_access_groups CASCADE;
DROP POLICY IF EXISTS "Admins can manage document access groups" ON document_access_groups CASCADE;
DROP POLICY IF EXISTS "Allow public read access to teams" ON teams CASCADE;
DROP POLICY IF EXISTS "Allow public read access to applications" ON applications CASCADE;
DROP POLICY IF EXISTS "Allow public read access to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public read access to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public read access to document_templates" ON document_templates CASCADE;
DROP POLICY IF EXISTS "Allow public read access to document_versions" ON document_versions CASCADE;
DROP POLICY IF EXISTS "Allow public read access to document_files" ON document_files CASCADE;
DROP POLICY IF EXISTS "Allow public insert to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public insert to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public insert to document_versions" ON document_versions CASCADE;
DROP POLICY IF EXISTS "Allow public insert to document_files" ON document_files CASCADE;
DROP POLICY IF EXISTS "Allow public update to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public update to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public delete to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public delete to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public update to document_files" ON document_files CASCADE;
DROP POLICY IF EXISTS "Allow public delete to document_files" ON document_files CASCADE;

-- Drop tables (drop dependent tables first)
DROP TABLE IF EXISTS document_access_groups CASCADE;
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS document_files CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS team_documents CASCADE;
DROP TABLE IF EXISTS base_documents CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_document_version() CASCADE;
DROP FUNCTION IF EXISTS create_initial_version() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: CREATE EXTENSIONS
-- ============================================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create initial version on document creation
CREATE OR REPLACE FUNCTION create_initial_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO document_versions (
    document_id,
    document_type,
    version_number,
    content,
    title,
    category,
    change_summary
  ) VALUES (
    NEW.id,
    CASE 
      WHEN TG_TABLE_NAME = 'base_documents' THEN 'base'
      WHEN TG_TABLE_NAME = 'team_documents' THEN 'team'
    END,
    1,
    NEW.content,
    NEW.title,
    NEW.category,
    'Initial version'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create version on document update
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  table_name TEXT;
  doc_type TEXT;
BEGIN
  -- Determine table name based on TG_TABLE_NAME
  table_name := TG_TABLE_NAME;
  
  -- Determine document type
  doc_type := CASE 
    WHEN table_name = 'base_documents' THEN 'base'
    WHEN table_name = 'team_documents' THEN 'team'
  END;
  
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM document_versions
  WHERE document_id = NEW.id
    AND document_type = doc_type;
  
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content OR 
     OLD.title IS DISTINCT FROM NEW.title OR
     OLD.category IS DISTINCT FROM NEW.category THEN
    
    INSERT INTO document_versions (
      document_id,
      document_type,
      version_number,
      content,
      title,
      category,
      change_summary
    ) VALUES (
      NEW.id,
      doc_type,
      next_version,
      OLD.content,
      OLD.title,
      OLD.category,
      'Auto-saved version'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE CORE TABLES
-- ============================================================================

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  workos_organization_id TEXT, -- Maps to WorkOS organization ID (optional, for syncing)
  parent_organization_id TEXT, -- References parent organization's WorkOS ID (for subgroups)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application groups table (for organizing applications)
CREATE TABLE application_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_name TEXT, -- Optional icon (Lucide icon name)
  color TEXT, -- Optional color (Tailwind color class)
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table (shared across all teams)
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- e.g., 'Globe', 'Database', etc.
  color TEXT NOT NULL, -- Tailwind color classes
  group_id UUID REFERENCES application_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Base documents table (shared across all teams)
CREATE TABLE base_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team documents table (team-specific)
CREATE TABLE team_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document templates table
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

-- Document versions table (tracks all versions of documents)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('base', 'team')),
  version_number INTEGER NOT NULL,
  content TEXT,
  title TEXT,
  category TEXT,
  change_summary TEXT, -- Optional summary of changes
  created_by TEXT, -- WorkOS user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique version per document
  UNIQUE(document_id, document_type, version_number)
);

-- Document files table (stores metadata for files attached to documents or applications)
CREATE TABLE document_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID, -- NULL for application-level files
  document_type TEXT CHECK (document_type IN ('base', 'team')), -- NULL for application-level files
  application_id TEXT REFERENCES applications(id) ON DELETE CASCADE, -- NULL for document-level files
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- NULL for public application files
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL, -- MIME type
  file_size BIGINT NOT NULL, -- bytes
  storage_bucket TEXT NOT NULL DEFAULT 'documents',
  visibility TEXT NOT NULL DEFAULT 'team' CHECK (visibility IN ('public', 'team')), -- public = all teams, team = specific team
  uploaded_by TEXT, -- WorkOS user ID
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure file paths are unique
  UNIQUE(file_path),
  
  -- Ensure we have either document_id or application_id
  CHECK (
    (document_id IS NOT NULL AND document_type IS NOT NULL) OR
    (application_id IS NOT NULL)
  )
);

-- ============================================================================
-- STEP 5: CREATE USER GROUPS AND ACCESS CONTROL TABLES
-- ============================================================================

-- User groups table (maps to WorkOS user IDs)
CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- WorkOS user ID (prof_xxxxx for SSO)
  group_name TEXT NOT NULL, -- Group name (e.g., "Engineering", "Sales", "Support")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_name) -- User can only be in a group once
);

-- User roles table (admin, user, etc.)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE, -- WorkOS user ID
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document access groups (which groups can access which team documents)
CREATE TABLE document_access_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_document_id UUID NOT NULL REFERENCES team_documents(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL, -- Must match group_name in user_groups
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_document_id, group_name)
);

-- ============================================================================
-- STEP 6: CREATE INDEXES
-- ============================================================================

-- Core table indexes
CREATE INDEX idx_base_documents_app_id ON base_documents(application_id);
CREATE INDEX idx_team_documents_team_app ON team_documents(team_id, application_id);
CREATE INDEX idx_team_documents_app_id ON team_documents(application_id);
CREATE INDEX idx_applications_group_id ON applications(group_id);

-- Template indexes
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_app_id ON document_templates(application_id);

-- Version indexes
CREATE INDEX idx_document_versions_doc ON document_versions(document_id, document_type);
CREATE INDEX idx_document_versions_created ON document_versions(created_at DESC);

-- File indexes
CREATE INDEX idx_document_files_document ON document_files(document_id, document_type);
CREATE INDEX idx_document_files_application ON document_files(application_id);
CREATE INDEX idx_document_files_team ON document_files(team_id);
CREATE INDEX idx_document_files_visibility ON document_files(visibility);
CREATE INDEX idx_document_files_uploaded_at ON document_files(uploaded_at DESC);
CREATE INDEX idx_document_files_file_type ON document_files(file_type);

-- User groups and roles indexes
CREATE INDEX idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX idx_user_groups_group_name ON user_groups(group_name);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_document_access_groups_doc_id ON document_access_groups(team_document_id);
CREATE INDEX idx_document_access_groups_group_name ON document_access_groups(group_name);
CREATE INDEX idx_teams_workos_org_id ON teams(workos_organization_id);

-- ============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on core tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user groups and roles tables (defense in depth)
-- NOTE: We use WorkOS for authentication, not Supabase Auth, so RLS policies
-- that rely on auth.jwt() won't work. However, we enable RLS with deny-all policies
-- to protect against direct database access. The service role client bypasses RLS.
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_groups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: CREATE RLS POLICIES
-- ============================================================================

-- Read policies for core tables (allow public read for now)
CREATE POLICY "Allow public read access to teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to applications" ON applications
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to base_documents" ON base_documents
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to team_documents" ON team_documents
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to document_templates" ON document_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to document_versions" ON document_versions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to document_files" ON document_files
  FOR SELECT USING (true);

-- Insert policies for documents
CREATE POLICY "Allow public insert to base_documents" ON base_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to team_documents" ON team_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to document_versions" ON document_versions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to document_files" ON document_files
  FOR INSERT WITH CHECK (true);

-- Update policies for documents
CREATE POLICY "Allow public update to base_documents" ON base_documents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public update to team_documents" ON team_documents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public update to document_files" ON document_files
  FOR UPDATE USING (true) WITH CHECK (true);

-- Delete policies for documents
CREATE POLICY "Allow public delete to base_documents" ON base_documents
  FOR DELETE USING (true);

CREATE POLICY "Allow public delete to team_documents" ON team_documents
  FOR DELETE USING (true);

CREATE POLICY "Allow public delete to document_files" ON document_files
  FOR DELETE USING (true);

-- ============================================================================
-- SECURITY POLICIES: User groups, roles, and access control
-- These tables contain sensitive information and should NOT be publicly accessible
-- All access is through the service role client with application-level authorization
-- ============================================================================

-- Deny all access to user_groups table (only service role can access)
CREATE POLICY "Deny all access to user_groups" ON user_groups
  FOR ALL USING (false) WITH CHECK (false);

-- Deny all access to user_roles table (only service role can access)
CREATE POLICY "Deny all access to user_roles" ON user_roles
  FOR ALL USING (false) WITH CHECK (false);

-- Deny all access to document_access_groups table (only service role can access)
CREATE POLICY "Deny all access to document_access_groups" ON document_access_groups
  FOR ALL USING (false) WITH CHECK (false);

-- ============================================================================
-- STEP 9: CREATE TRIGGERS
-- ============================================================================

-- Triggers for updated_at timestamps
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_documents_updated_at BEFORE UPDATE ON base_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_documents_updated_at BEFORE UPDATE ON team_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_files_updated_at BEFORE UPDATE ON document_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_groups_updated_at BEFORE UPDATE ON user_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for version tracking (initial versions)
CREATE TRIGGER create_initial_base_version
  AFTER INSERT ON base_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_version();

CREATE TRIGGER create_initial_team_version
  AFTER INSERT ON team_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_version();

-- Triggers for version tracking (on updates)
CREATE TRIGGER create_base_document_version
  BEFORE UPDATE ON base_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

CREATE TRIGGER create_team_document_version
  BEFORE UPDATE ON team_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

-- ============================================================================
-- DATABASE RESET COMPLETE
-- ============================================================================
-- 
-- Next steps:
-- 1. Run: bun run seed (to populate initial data if you have a seed script)
-- 2. Create your first admin user in user_roles table:
--    INSERT INTO user_roles (user_id, role)
--    VALUES ('prof_xxxxxxxxxxxxx', 'admin')
--    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
--    (Replace 'prof_xxxxxxxxxxxxx' with your WorkOS user ID)
-- 3. Create Supabase Storage bucket 'documents' for file uploads:
--    - Go to Supabase Dashboard → Storage
--    - Create new bucket named 'documents'
--    - Configure storage policies if needed
-- 4. Verify tables were created:
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_schema = 'public' 
--    ORDER BY table_name;
-- ============================================================================

