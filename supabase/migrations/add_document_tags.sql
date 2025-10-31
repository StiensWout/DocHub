-- Migration: Add document tags system
-- This migration creates the tags table and document_tags junction table
-- to enable tagging functionality for documents

-- Create tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT, -- Optional color for tag display (e.g., "blue-500", "red-600")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_tags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_tags (
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('base', 'team')),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (document_id, document_type, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_tags_document ON document_tags(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Create trigger for updated_at on tags if the function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
    CREATE TRIGGER update_tags_updated_at 
      BEFORE UPDATE ON tags
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags (read-only for authenticated users)
-- Users can view all tags
DROP POLICY IF EXISTS "Users can view tags" ON tags;
CREATE POLICY "Users can view tags"
ON tags FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for document_tags
-- Users can view document tags
DROP POLICY IF EXISTS "Users can view document tags" ON document_tags;
CREATE POLICY "Users can view document tags"
ON document_tags FOR SELECT
TO authenticated
USING (true);

-- Helper function to create or get a tag by name
-- This function creates a tag if it doesn't exist, or returns the existing tag
CREATE OR REPLACE FUNCTION get_or_create_tag(tag_name TEXT, tag_color TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  tag_id UUID;
  tag_slug TEXT;
BEGIN
  -- Create slug from tag name (lowercase, replace spaces with hyphens, remove special chars)
  tag_slug := lower(regexp_replace(regexp_replace(tag_name, '[^a-z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  
  -- Try to find existing tag by slug
  SELECT id INTO tag_id
  FROM tags
  WHERE slug = tag_slug;
  
  -- If tag doesn't exist, create it
  IF tag_id IS NULL THEN
    INSERT INTO tags (name, slug, color)
    VALUES (tag_name, tag_slug, tag_color)
    RETURNING id INTO tag_id;
  END IF;
  
  RETURN tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

