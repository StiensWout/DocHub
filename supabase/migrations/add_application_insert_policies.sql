-- Migration: Add INSERT/UPDATE/DELETE policies for applications table
-- This allows applications to be created, updated, and deleted

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public insert to applications" ON applications;
DROP POLICY IF EXISTS "Allow public update to applications" ON applications;
DROP POLICY IF EXISTS "Allow public delete to applications" ON applications;

-- Allow insert for applications (public access for now)
CREATE POLICY "Allow public insert to applications" ON applications
  FOR INSERT WITH CHECK (true);

-- Allow update for applications
CREATE POLICY "Allow public update to applications" ON applications
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for applications
CREATE POLICY "Allow public delete to applications" ON applications
  FOR DELETE USING (true);

