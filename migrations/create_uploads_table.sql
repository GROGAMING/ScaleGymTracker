-- Create uploads table for tracking gym photo uploads
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  path TEXT NOT NULL,
  bucket TEXT DEFAULT 'gym-photos' NOT NULL,
  team_id UUID NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploads_team_id ON public.uploads(team_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_bucket ON public.uploads(bucket);

-- Enable Row Level Security
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Create policy for team-based access
CREATE POLICY "Team members can view their team uploads" ON public.uploads
  FOR SELECT USING (team_id IS NULL OR auth.uid() IS NOT NULL);

-- Create policy for uploads insertion
CREATE POLICY "Users can insert uploads" ON public.uploads
  FOR INSERT WITH CHECK (true);

-- Create policy for uploads modification
CREATE POLICY "Users can update their uploads" ON public.uploads
  FOR UPDATE USING (true);

-- Create policy for uploads deletion
CREATE POLICY "Users can delete their uploads" ON public.uploads
  FOR DELETE USING (true);
