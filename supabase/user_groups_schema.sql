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

-- Enable Row Level Security for defense in depth
-- NOTE: This application uses WorkOS for authentication, not Supabase Auth.
-- RLS policies that rely on auth.jwt() won't work with WorkOS auth.
-- We enable RLS with deny-all policies to protect against direct database access.
-- All application access uses the service role client which bypasses RLS.
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_groups ENABLE ROW LEVEL SECURITY;

-- Deny all public access to these sensitive tables
-- Only the service role client (supabaseAdmin) can access these tables
CREATE POLICY "Deny all access to user_groups" ON user_groups
  FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny all access to user_roles" ON user_roles
  FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny all access to document_access_groups" ON document_access_groups
  FOR ALL USING (false) WITH CHECK (false);

-- Authorization is handled at the application level:
-- - All database access uses `supabaseAdmin` (service role) which bypasses RLS
-- - Application-level authorization checks are performed using:
--   - `getSession()` from `lib/auth/session.ts` (WorkOS session)
--   - `isAdmin()` and `getUserGroups()` from `lib/auth/user-groups.ts`
--   - API routes enforce authorization before database queries
--
-- The deny-all RLS policies provide defense in depth against:
-- - Accidental use of non-service-role clients
-- - Direct database access if credentials are compromised
-- - Misconfiguration that might expose these tables

-- Add updated_at triggers
CREATE TRIGGER update_user_groups_updated_at BEFORE UPDATE ON user_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

