-- ============================================
-- Migration: Add user_id columns + Enable RLS
-- Run this in the Supabase SQL Editor
-- (after running the original schema.sql)
-- ============================================

-- 1. Add user_id column to dishes
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add user_id column to reformulations
ALTER TABLE reformulations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Add user_id column to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Add user_id column to marketing_content
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Create indexes on user_id
CREATE INDEX IF NOT EXISTS idx_dishes_user_id ON dishes(user_id);
CREATE INDEX IF NOT EXISTS idx_reformulations_user_id ON reformulations(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_content_user_id ON marketing_content(user_id);

-- 6. Drop the custom users table (Supabase Auth manages users via auth.users)
DROP TABLE IF EXISTS users;

-- 7. Enable Row Level Security on all tables
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reformulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for dishes
CREATE POLICY "Users can view their own dishes"
  ON dishes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dishes"
  ON dishes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dishes"
  ON dishes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dishes"
  ON dishes FOR DELETE
  USING (auth.uid() = user_id);

-- 9. RLS Policies for reformulations
CREATE POLICY "Users can view their own reformulations"
  ON reformulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reformulations"
  ON reformulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reformulations"
  ON reformulations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reformulations"
  ON reformulations FOR DELETE
  USING (auth.uid() = user_id);

-- 10. RLS Policies for videos
CREATE POLICY "Users can view their own videos"
  ON videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
  ON videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON videos FOR DELETE
  USING (auth.uid() = user_id);

-- 11. RLS Policies for marketing_content
CREATE POLICY "Users can view their own marketing_content"
  ON marketing_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own marketing_content"
  ON marketing_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketing_content"
  ON marketing_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketing_content"
  ON marketing_content FOR DELETE
  USING (auth.uid() = user_id);
