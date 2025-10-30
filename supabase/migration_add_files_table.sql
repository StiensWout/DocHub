-- ============================================================================
-- Migration: Add document_files table to existing database
-- ============================================================================
-- Run this if you already have a database and want to add file support
-- This will NOT delete existing data
-- ============================================================================

-- Create document_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_files (
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
  uploaded_by UUID, -- REFERENCES auth.users(id) when auth is implemented
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure file paths are unique
  CONSTRAINT unique_file_path UNIQUE(file_path),
  
  -- Ensure we have either document_id or application_id
  CONSTRAINT check_file_context CHECK (
    (document_id IS NOT NULL AND document_type IS NOT NULL) OR
    (application_id IS NOT NULL)
  )
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_document_files_document ON document_files(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_files_application ON document_files(application_id);
CREATE INDEX IF NOT EXISTS idx_document_files_team ON document_files(team_id);
CREATE INDEX IF NOT EXISTS idx_document_files_visibility ON document_files(visibility);
CREATE INDEX IF NOT EXISTS idx_document_files_uploaded_at ON document_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_files_file_type ON document_files(file_type);

-- Enable RLS if not already enabled
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop first if they exist to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to document_files" ON document_files;
DROP POLICY IF EXISTS "Allow public insert to document_files" ON document_files;
DROP POLICY IF EXISTS "Allow public update to document_files" ON document_files;
DROP POLICY IF EXISTS "Allow public delete to document_files" ON document_files;

CREATE POLICY "Allow public read access to document_files" ON document_files
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to document_files" ON document_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to document_files" ON document_files
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete to document_files" ON document_files
  FOR DELETE USING (true);

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_document_files_updated_at ON document_files;

CREATE TRIGGER update_document_files_updated_at BEFORE UPDATE ON document_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE document_files IS 'Stores metadata for files attached to documents or applications';
COMMENT ON COLUMN document_files.document_id IS 'ID of the document (NULL for application-level files)';
COMMENT ON COLUMN document_files.document_type IS 'Type of document: base or team (NULL for application-level files)';
COMMENT ON COLUMN document_files.application_id IS 'ID of the application (NULL for document-level files)';
COMMENT ON COLUMN document_files.visibility IS 'File visibility: public (all teams) or team (specific team)';
COMMENT ON COLUMN document_files.file_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN document_files.file_type IS 'MIME type of the file';
COMMENT ON COLUMN document_files.file_size IS 'Size of file in bytes';

