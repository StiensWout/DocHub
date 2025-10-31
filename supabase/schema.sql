-- Database Schema for DocHub Documentation Manager
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  workos_organization_id TEXT, -- Maps to WorkOS organization ID (optional, for syncing)
  parent_organization_id TEXT, -- References parent organization's WorkOS ID (for subgroups)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table (shared across all teams)
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- e.g., 'Globe', 'Database', etc.
  color TEXT NOT NULL, -- Tailwind color classes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Base documents table (shared across all teams)
CREATE TABLE IF NOT EXISTS base_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team documents table (team-specific)
CREATE TABLE IF NOT EXISTS team_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_base_documents_app_id ON base_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_team_documents_team_app ON team_documents(team_id, application_id);
CREATE INDEX IF NOT EXISTS idx_team_documents_app_id ON team_documents(application_id);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all reads for now (can be restricted later with auth)
CREATE POLICY "Allow public read access to teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to applications" ON applications
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to base_documents" ON base_documents
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to team_documents" ON team_documents
  FOR SELECT USING (true);

-- Allow insert/update/delete with service role (for admin operations)
-- These will be handled server-side with service role key

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_documents_updated_at BEFORE UPDATE ON base_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_documents_updated_at BEFORE UPDATE ON team_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
