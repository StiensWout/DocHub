-- Migration: Add users and user_settings tables
-- This migration creates tables to store users and user settings locally
-- WorkOS remains the master - local copy is for tracking and offline admin access

-- Create users table to store local copy of WorkOS users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workos_user_id TEXT NOT NULL UNIQUE, -- WorkOS user ID (prof_xxxxx or user_xxxxx)
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email_verified BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE, -- When last synced from WorkOS
  synced_from_workos BOOLEAN DEFAULT true, -- Whether this user was synced from WorkOS
  
  -- Ensure workos_user_id is unique
  CONSTRAINT users_workos_user_id_unique UNIQUE (workos_user_id)
);

-- Create user_settings table to store user preferences and settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workos_user_id TEXT NOT NULL, -- Denormalized for easier queries
  settings JSONB DEFAULT '{}'::jsonb, -- Flexible JSON storage for various settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one settings record per user
  UNIQUE (user_id),
  UNIQUE (workos_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_workos_user_id ON users(workos_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_workos_user_id ON user_settings(workos_user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_settings ON user_settings USING gin(settings);

-- Create trigger for updated_at on users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on user_settings table
CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create deny-all policies (access through service role only)
CREATE POLICY "Deny all access to users" ON users
  FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny all access to user_settings" ON user_settings
  FOR ALL USING (false) WITH CHECK (false);

-- Add comments
COMMENT ON TABLE users IS 'Local copy of WorkOS users for offline admin access and tracking. WorkOS is the master source of truth.';
COMMENT ON TABLE user_settings IS 'User preferences and settings. Changes sync to WorkOS user profile/metadata when possible.';
COMMENT ON COLUMN users.last_synced_at IS 'Timestamp when user was last synced from WorkOS';
COMMENT ON COLUMN users.synced_from_workos IS 'Whether this user was synced from WorkOS (true) or created locally (false)';
COMMENT ON COLUMN user_settings.settings IS 'JSONB object storing user preferences, theme, notifications, etc.';

