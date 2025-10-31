-- Migration: Add workos_organization_id to teams table
-- This allows syncing WorkOS Organizations to DocHub Teams

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'workos_organization_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN workos_organization_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_teams_workos_org_id ON teams(workos_organization_id);
  END IF;
END $$;

COMMENT ON COLUMN teams.workos_organization_id IS 'Maps to WorkOS organization ID for automatic team creation from organizations';

