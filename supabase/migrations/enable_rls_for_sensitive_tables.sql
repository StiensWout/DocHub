-- Migration: Enable RLS on sensitive tables with deny-all policies
-- This provides defense in depth security even though we use service role client

-- Enable RLS on user groups and roles tables
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Deny all access to user_groups" ON user_groups;
DROP POLICY IF EXISTS "Deny all access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Deny all access to document_access_groups" ON document_access_groups;

-- Create deny-all policies for sensitive tables
-- Only the service role client (supabaseAdmin) can access these tables
CREATE POLICY "Deny all access to user_groups" ON user_groups
  FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny all access to user_roles" ON user_roles
  FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny all access to document_access_groups" ON document_access_groups
  FOR ALL USING (false) WITH CHECK (false);

COMMENT ON POLICY "Deny all access to user_groups" ON user_groups IS 
  'Denies all public access. Only service role can access. Application uses WorkOS auth, not Supabase Auth.';

COMMENT ON POLICY "Deny all access to user_roles" ON user_roles IS 
  'Denies all public access. Only service role can access. Application uses WorkOS auth, not Supabase Auth.';

COMMENT ON POLICY "Deny all access to document_access_groups" ON document_access_groups IS 
  'Denies all public access. Only service role can access. Application uses WorkOS auth, not Supabase Auth.';

