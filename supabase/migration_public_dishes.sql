-- Migration: Allow Sprout consumers to view all dishes (public read)
-- Run this in the Supabase SQL Editor
-- The dishes table currently only allows owners to view their own dishes.
-- Sprout consumers need to be able to browse all dishes from all cafes.

CREATE POLICY "Anyone can view all dishes"
  ON dishes FOR SELECT
  USING (true);

-- Also allow public read on reformulations so Sprout can fetch them
CREATE POLICY "Anyone can view reformulations"
  ON reformulations FOR SELECT
  USING (true);
