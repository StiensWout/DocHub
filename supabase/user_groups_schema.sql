-- User Groups and Access Control Schema
-- Run this in Supabase SQL Editor after main schema

-- User groups table (maps to WorkOS user IDs)
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- WorkOS user ID (prof_xxxxx for SSO)
  group_name TEXT NOT NULL, -- Group name (e.g., "Engineering", "Sales", "Support")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_name) -- User can only be in a group once
);

-- User roles table (admin, user, etc.)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE, -- WorkOS user ID
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document access groups (which groups can access which team documents)
CREATE TABLE IF NOT EXISTS document_access_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_document_id UUID NOT NULL REFERENCES team_documents(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL, -- Must match group_name in user_groups
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_document_id, group_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_name ON user_groups(group_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_document_access_groups_doc_id ON document_access_groups(team_document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_groups_group_name ON document_access_groups(group_name);

-- Enable Row Level Security
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own groups and roles
CREATE POLICY "Users can view their own groups" ON user_groups
  FOR SELECT USING (auth.jwt() ->> 'user_id' = user_id::text);

CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.jwt() ->> 'user_id' = user_id::text);

-- Admins can see all
CREATE POLICY "Admins can view all user groups" ON user_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (auth.jwt() ->> 'user_id')::text 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage user groups" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (auth.jwt() ->> 'user_id')::text 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all user roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (auth.jwt() ->> 'user_id')::text 
      AND ur.role = 'admin'
    )
  );

-- Users can view document access groups for documents they have access to
CREATE POLICY "Users can view document access groups" ON document_access_groups
  FOR SELECT USING (
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (auth.jwt() ->> 'user_id')::text 
      AND ur.role = 'admin'
    )
    OR
    -- User has access if they're in the group
    EXISTS (
      SELECT 1 FROM user_groups ug
      WHERE ug.user_id = (auth.jwt() ->> 'user_id')::text
      AND ug.group_name = document_access_groups.group_name
    )
  );

-- Admins can manage document access groups
CREATE POLICY "Admins can manage document access groups" ON document_access_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (auth.jwt() ->> 'user_id')::text 
      AND ur.role = 'admin'
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_user_groups_updated_at BEFORE UPDATE ON user_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

