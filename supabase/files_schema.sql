-- ============================================================================
-- DocHub File Upload System Schema
-- ============================================================================
-- This schema adds file upload support to documents
-- Run this after the main schema.sql if using incremental setup
-- ============================================================================

-- ============================================================================
-- CREATE DOCUMENT FILES TABLE
-- ============================================================================

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
  UNIQUE(file_path),
  
  -- Ensure we have either document_id or application_id
  CHECK (
    (document_id IS NOT NULL AND document_type IS NOT NULL) OR
    (application_id IS NOT NULL)
  )
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_document_files_document ON document_files(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_files_application ON document_files(application_id);
CREATE INDEX IF NOT EXISTS idx_document_files_team ON document_files(team_id);
CREATE INDEX IF NOT EXISTS idx_document_files_visibility ON document_files(visibility);
CREATE INDEX IF NOT EXISTS idx_document_files_uploaded_at ON document_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_files_file_type ON document_files(file_type);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Read policy: Allow public read access to files
CREATE POLICY "Allow public read access to document_files" ON document_files
  FOR SELECT USING (true);

-- Insert policy: Allow public insert to files
CREATE POLICY "Allow public insert to document_files" ON document_files
  FOR INSERT WITH CHECK (true);

-- Update policy: Allow public update to files
CREATE POLICY "Allow public update to document_files" ON document_files
  FOR UPDATE USING (true) WITH CHECK (true);

-- Delete policy: Allow public delete to files
CREATE POLICY "Allow public delete to document_files" ON document_files
  FOR DELETE USING (true);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger for updated_at timestamp
CREATE TRIGGER update_document_files_updated_at BEFORE UPDATE ON document_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE document_files IS 'Stores metadata for files attached to documents';
COMMENT ON COLUMN document_files.document_id IS 'ID of the document (can be from base_documents or team_documents)';
COMMENT ON COLUMN document_files.document_type IS 'Type of document: base or team';
COMMENT ON COLUMN document_files.file_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN document_files.file_type IS 'MIME type of the file';
COMMENT ON COLUMN document_files.file_size IS 'Size of file in bytes';

