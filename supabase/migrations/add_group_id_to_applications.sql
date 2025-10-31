-- Migration: Add group_id column to applications table
-- This migration adds the group_id column to applications if it doesn't exist
-- and ensures the application_groups table exists

-- Create application_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS application_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_name TEXT, -- Optional icon (Lucide icon name)
  color TEXT, -- Optional color (Tailwind color class)
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add group_id column to applications if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE applications 
    ADD COLUMN group_id UUID REFERENCES application_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_applications_group_id ON applications(group_id);

-- Create trigger for updated_at on application_groups if it doesn't exist
CREATE TRIGGER update_application_groups_updated_at 
  BEFORE UPDATE ON application_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
