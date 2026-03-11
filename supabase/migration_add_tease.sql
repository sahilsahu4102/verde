-- Migration to add teasing ingredient description to reformulations
-- Run this in the Supabase SQL Editor

ALTER TABLE reformulations
ADD COLUMN IF NOT EXISTS teasing_ingredient_description TEXT;
