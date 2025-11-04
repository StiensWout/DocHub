-- ============================================================================
-- DocHub Database Purge Script
-- ============================================================================
-- This script COMPLETELY DROPS all database objects (tables, functions, triggers, policies).
-- WARNING: This will DELETE ALL DATA in ALL tables!
-- 
-- Use this script when you need to:
-- - Reset the database to a clean state before running create.sql
-- - Fix schema inconsistencies
-- - Start fresh with test data
--
-- BEFORE RUNNING:
-- 1. BACKUP your data if needed (export to SQL or use Supabase backup)
-- 2. Ensure you have access to Supabase SQL Editor with admin privileges
-- 3. Note: This will also remove any custom RLS policies you've added
--
-- Run this in Supabase SQL Editor, then run create.sql to recreate the schema
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL TRIGGERS (they depend on tables and functions)
-- ============================================================================

DROP TRIGGER IF EXISTS create_initial_team_version ON team_documents CASCADE;
DROP TRIGGER IF EXISTS create_initial_base_version ON base_documents CASCADE;
DROP TRIGGER IF EXISTS create_team_document_version ON team_documents CASCADE;
DROP TRIGGER IF EXISTS create_base_document_version ON base_documents CASCADE;
DROP TRIGGER IF EXISTS update_team_documents_updated_at ON team_documents CASCADE;
DROP TRIGGER IF EXISTS update_base_documents_updated_at ON base_documents CASCADE;
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications CASCADE;
DROP TRIGGER IF EXISTS update_application_groups_updated_at ON application_groups CASCADE;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams CASCADE;
DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates CASCADE;
DROP TRIGGER IF EXISTS update_document_files_updated_at ON document_files CASCADE;
DROP TRIGGER IF EXISTS update_user_groups_updated_at ON user_groups CASCADE;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles CASCADE;

-- ============================================================================
-- STEP 2: DROP ALL POLICIES (they depend on tables)
-- ============================================================================

-- Drop all policies using CASCADE to handle any dependencies
-- Note: We drop policies on tables that may not exist without errors

DROP POLICY IF EXISTS "Users can view their own groups" ON user_groups CASCADE;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles CASCADE;
DROP POLICY IF EXISTS "Admins can view all user groups" ON user_groups CASCADE;
DROP POLICY IF EXISTS "Admins can manage user groups" ON user_groups CASCADE;
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles CASCADE;
DROP POLICY IF EXISTS "Users can view document access groups" ON document_access_groups CASCADE;
DROP POLICY IF EXISTS "Admins can manage document access groups" ON document_access_groups CASCADE;
DROP POLICY IF EXISTS "Deny all access to user_groups" ON user_groups CASCADE;
DROP POLICY IF EXISTS "Deny all access to user_roles" ON user_roles CASCADE;
DROP POLICY IF EXISTS "Deny all access to document_access_groups" ON document_access_groups CASCADE;
DROP POLICY IF EXISTS "Allow public read access to teams" ON teams CASCADE;
DROP POLICY IF EXISTS "Allow public read access to application_groups" ON application_groups CASCADE;
DROP POLICY IF EXISTS "Allow public read access to applications" ON applications CASCADE;
DROP POLICY IF EXISTS "Allow public read access to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public read access to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public read access to document_templates" ON document_templates CASCADE;
DROP POLICY IF EXISTS "Allow public read access to document_versions" ON document_versions CASCADE;
DROP POLICY IF EXISTS "Allow public read access to document_files" ON document_files CASCADE;
DROP POLICY IF EXISTS "Allow public insert to application_groups" ON application_groups CASCADE;
DROP POLICY IF EXISTS "Allow public insert to applications" ON applications CASCADE;
DROP POLICY IF EXISTS "Allow public insert to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public insert to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public insert to document_versions" ON document_versions CASCADE;
DROP POLICY IF EXISTS "Allow public insert to document_files" ON document_files CASCADE;
DROP POLICY IF EXISTS "Allow public update to application_groups" ON application_groups CASCADE;
DROP POLICY IF EXISTS "Allow public update to applications" ON applications CASCADE;
DROP POLICY IF EXISTS "Allow public update to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public update to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public update to document_files" ON document_files CASCADE;
DROP POLICY IF EXISTS "Allow public delete to application_groups" ON application_groups CASCADE;
DROP POLICY IF EXISTS "Allow public delete to applications" ON applications CASCADE;
DROP POLICY IF EXISTS "Allow public delete to base_documents" ON base_documents CASCADE;
DROP POLICY IF EXISTS "Allow public delete to team_documents" ON team_documents CASCADE;
DROP POLICY IF EXISTS "Allow public delete to document_files" ON document_files CASCADE;

-- ============================================================================
-- STEP 3: DROP ALL TABLES (drop dependent tables first)
-- ============================================================================

DROP TABLE IF EXISTS document_access_groups CASCADE;
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS document_files CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS team_documents CASCADE;
DROP TABLE IF EXISTS base_documents CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS application_groups CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- STEP 4: DROP ALL FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS create_document_version() CASCADE;
DROP FUNCTION IF EXISTS create_initial_version() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- PURGE COMPLETE
-- ============================================================================
-- 
-- All database objects have been removed.
-- Run create.sql to recreate the schema from scratch.
-- ============================================================================

