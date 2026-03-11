-- Add published column to dishes table
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
