-- Migration: Add parent_organization_id to teams table
-- This allows linking subgroup teams to their parent organization

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'parent_organization_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN parent_organization_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_teams_parent_org_id ON teams(parent_organization_id);
  END IF;
END $$;

COMMENT ON COLUMN teams.parent_organization_id IS 'References parent organization WorkOS ID for subgroup teams within an organization';

