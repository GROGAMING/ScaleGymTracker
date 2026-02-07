-- Migration: Add teams join code and profiles table

-- Add columns to teams table
ALTER TABLE teams ADD COLUMN join_code TEXT UNIQUE;
ALTER TABLE teams ADD COLUMN join_code_active BOOLEAN DEFAULT TRUE;

-- Create profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Assuming team_members table exists, enable RLS if not
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS for team_members
CREATE POLICY "Users can view their memberships" ON team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow join via API" ON team_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams WHERE id = team_id AND join_code_active = TRUE
  )
);

-- For players and uploads, assuming they have team_id
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can access players in their teams" ON players FOR ALL USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can access uploads in their teams" ON uploads FOR ALL USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Storage policies (assuming bucket 'gym-photos')
-- Note: Storage policies use bucket_id, but for simplicity
-- In Supabase dashboard, add policies to storage.objects:
-- Allow select/insert/update/delete where name LIKE (team_id || '/%') and team_id in user's teams
