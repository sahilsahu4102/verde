-- ============================================
-- Verde Database Schema for Supabase
-- Complete schema with authentication support
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Dishes table (menu items)
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  is_best_seller BOOLEAN DEFAULT false,
  image_url TEXT,
  image_hint TEXT,
  ingredients TEXT[] DEFAULT '{}',
  cuisine TEXT DEFAULT 'International',
  price_original NUMERIC(10,2) DEFAULT 0,
  price_plant_based NUMERIC(10,2) DEFAULT 0,
  nutrition_original JSONB DEFAULT '{}',
  nutrition_plant_based_initial JSONB DEFAULT '{}',
  nutrition_plant_based_optimized JSONB DEFAULT '{}',
  impact INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Reformulations table (AI-generated plant-based analysis)
CREATE TABLE IF NOT EXISTS reformulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_based_ingredients TEXT,
  taste_similarity NUMERIC(5,2),
  texture_similarity NUMERIC(5,2),
  customer_noticeable_difference TEXT,
  ingredient_swap_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dish_id)
);

-- 3. Videos table (generated video reel metadata/URLs)
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dish_id)
);

-- 4. Marketing content table
CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT,
  hashtags TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dish_id)
);

-- Enable Row Level Security
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reformulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies: dishes
CREATE POLICY "Users can view their own dishes" ON dishes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own dishes" ON dishes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dishes" ON dishes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dishes" ON dishes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: reformulations
CREATE POLICY "Users can view their own reformulations" ON reformulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reformulations" ON reformulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reformulations" ON reformulations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reformulations" ON reformulations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: videos
CREATE POLICY "Users can view their own videos" ON videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: marketing_content
CREATE POLICY "Users can view their own marketing_content" ON marketing_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own marketing_content" ON marketing_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own marketing_content" ON marketing_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own marketing_content" ON marketing_content FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dishes_user_id ON dishes(user_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);
CREATE INDEX IF NOT EXISTS idx_reformulations_dish_id ON reformulations(dish_id);
CREATE INDEX IF NOT EXISTS idx_reformulations_user_id ON reformulations(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_dish_id ON videos(dish_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_content_dish_id ON marketing_content(dish_id);
CREATE INDEX IF NOT EXISTS idx_marketing_content_user_id ON marketing_content(user_id);
