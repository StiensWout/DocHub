-- ============================================================================
-- Application Groups Migration
-- ============================================================================
-- Adds support for organizing applications into groups/categories
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create application_groups table
CREATE TABLE IF NOT EXISTS application_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_name TEXT, -- Optional icon (Lucide icon name)
  color TEXT, -- Optional color (Tailwind color class)
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add group_id to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES application_groups(id) ON DELETE SET NULL;

-- Create index for group_id
CREATE INDEX IF NOT EXISTS idx_applications_group_id ON applications(group_id);

-- Create index for display_order
CREATE INDEX IF NOT EXISTS idx_application_groups_display_order ON application_groups(display_order);

-- Enable Row Level Security (RLS)
ALTER TABLE application_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_groups
-- Allow public read access
CREATE POLICY "Allow public read access to application_groups" ON application_groups
  FOR SELECT USING (true);

-- Allow public insert (for now, will be restricted with auth later)
CREATE POLICY "Allow public insert to application_groups" ON application_groups
  FOR INSERT WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update to application_groups" ON application_groups
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete to application_groups" ON application_groups
  FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_application_groups_updated_at BEFORE UPDATE ON application_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

