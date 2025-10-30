-- Add INSERT policies for documents
-- Run this in Supabase SQL Editor after the main schema

-- Allow insert for base_documents (public access for now)
CREATE POLICY "Allow public insert to base_documents" ON base_documents
  FOR INSERT WITH CHECK (true);

-- Allow insert for team_documents (public access for now)
CREATE POLICY "Allow public insert to team_documents" ON team_documents
  FOR INSERT WITH CHECK (true);

-- Allow update for base_documents
CREATE POLICY "Allow public update to base_documents" ON base_documents
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow update for team_documents
CREATE POLICY "Allow public update to team_documents" ON team_documents
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for base_documents
CREATE POLICY "Allow public delete to base_documents" ON base_documents
  FOR DELETE USING (true);

-- Allow delete for team_documents
CREATE POLICY "Allow public delete to team_documents" ON team_documents
  FOR DELETE USING (true);

-- Add INSERT, UPDATE, DELETE policies for applications
-- Allow insert for applications (public access for now)
CREATE POLICY "Allow public insert to applications" ON applications
  FOR INSERT WITH CHECK (true);

-- Allow update for applications
CREATE POLICY "Allow public update to applications" ON applications
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for applications
CREATE POLICY "Allow public delete to applications" ON applications
  FOR DELETE USING (true);