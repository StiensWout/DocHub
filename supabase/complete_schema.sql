-- ============================================================================
-- DocHub Complete Database Schema
-- ============================================================================
-- This script cleans and recreates the entire database schema to the latest version
-- Run this in Supabase SQL Editor to reset your database
-- WARNING: This will DELETE ALL DATA in the following tables:
--   - document_versions
--   - document_templates
--   - team_documents
--   - base_documents
--   - applications
--   - teams
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING OBJECTS (in reverse dependency order)
-- ============================================================================

-- Drop triggers first (they depend on tables)
DROP TRIGGER IF EXISTS create_initial_team_version ON team_documents;
DROP TRIGGER IF EXISTS create_initial_base_version ON base_documents;
DROP TRIGGER IF EXISTS create_team_document_version ON team_documents;
DROP TRIGGER IF EXISTS create_base_document_version ON base_documents;
DROP TRIGGER IF EXISTS update_team_documents_updated_at ON team_documents;
DROP TRIGGER IF EXISTS update_base_documents_updated_at ON base_documents;
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;

-- Drop tables (drop dependent tables first)
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

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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
-- STEP 4: CREATE TABLES
-- ============================================================================

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table (shared across all teams)
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- e.g., 'Globe', 'Database', etc.
  color TEXT NOT NULL, -- Tailwind color classes
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
  created_by TEXT, -- Will be user ID when auth is implemented
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique version per document
  UNIQUE(document_id, document_type, version_number)
);

-- ============================================================================
-- STEP 5: CREATE INDEXES
-- ============================================================================

-- Indexes for documents
CREATE INDEX idx_base_documents_app_id ON base_documents(application_id);
CREATE INDEX idx_team_documents_team_app ON team_documents(team_id, application_id);
CREATE INDEX idx_team_documents_app_id ON team_documents(application_id);

-- Indexes for templates
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_app_id ON document_templates(application_id);

-- Indexes for versions
CREATE INDEX idx_document_versions_doc ON document_versions(document_id, document_type);
CREATE INDEX idx_document_versions_created ON document_versions(created_at DESC);

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================================================

-- Read policies for all tables
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

-- Insert policies for documents
CREATE POLICY "Allow public insert to base_documents" ON base_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to team_documents" ON team_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to document_versions" ON document_versions
  FOR INSERT WITH CHECK (true);

-- Update policies for documents
CREATE POLICY "Allow public update to base_documents" ON base_documents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public update to team_documents" ON team_documents
  FOR UPDATE USING (true) WITH CHECK (true);

-- Delete policies for documents
CREATE POLICY "Allow public delete to base_documents" ON base_documents
  FOR DELETE USING (true);

CREATE POLICY "Allow public delete to team_documents" ON team_documents
  FOR DELETE USING (true);

-- ============================================================================
-- STEP 8: CREATE TRIGGERS
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
-- SCHEMA CREATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run: bun run seed (to populate initial data)
-- 2. Create Supabase Storage bucket 'documents' for file uploads
-- 3. Configure storage policies if needed
-- ============================================================================

