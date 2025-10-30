-- Document Versioning Schema
-- Run this in Supabase SQL Editor after the main schema

-- Document versions table (tracks all versions of documents)
CREATE TABLE IF NOT EXISTS document_versions (
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

-- Indexes for version queries
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_versions_created ON document_versions(created_at DESC);

-- Enable RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to document_versions" ON document_versions
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to document_versions" ON document_versions
  FOR INSERT WITH CHECK (true);

-- Function to auto-create version on document update
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  table_name TEXT;
  doc_type TEXT;
  latest_version_content TEXT;
  latest_version_title TEXT;
  latest_version_category TEXT;
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
  
  -- Get the latest version's content to compare against
  SELECT content, title, category
  INTO latest_version_content, latest_version_title, latest_version_category
  FROM document_versions
  WHERE document_id = NEW.id
    AND document_type = doc_type
    AND version_number = next_version - 1;
  
  -- Only create version if:
  -- 1. Content/title/category changed from NEW values
  -- 2. AND the OLD values are different from the latest saved version
  -- This prevents duplicates when the first update happens after creation
  IF (OLD.content IS DISTINCT FROM NEW.content OR 
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.category IS DISTINCT FROM NEW.category) AND
     (latest_version_content IS NULL OR -- No previous version exists
      OLD.content IS DISTINCT FROM latest_version_content OR
      OLD.title IS DISTINCT FROM latest_version_title OR
      OLD.category IS DISTINCT FROM latest_version_category) THEN
    
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

-- Create triggers for version tracking
CREATE TRIGGER create_base_document_version
  BEFORE UPDATE ON base_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

CREATE TRIGGER create_team_document_version
  BEFORE UPDATE ON team_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

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

-- Create triggers for initial version
CREATE TRIGGER create_initial_base_version
  AFTER INSERT ON base_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_version();

CREATE TRIGGER create_initial_team_version
  AFTER INSERT ON team_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_version();
