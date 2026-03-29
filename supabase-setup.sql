-- ============================================================
-- SUPABASE DATABASE SETUP — Shree Jewels
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create the jewellery_items table
CREATE TABLE IF NOT EXISTS jewellery_items (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_number  TEXT        UNIQUE NOT NULL,
  name           TEXT        NOT NULL,
  category       TEXT        NOT NULL,
  gram_weight    DECIMAL(10, 3) NOT NULL CHECK (gram_weight > 0),
  image1_url     TEXT,
  image2_url     TEXT,
  image3_url     TEXT,
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_jewellery_category ON jewellery_items (category);
CREATE INDEX IF NOT EXISTS idx_jewellery_created  ON jewellery_items (created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE jewellery_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Anyone (public) can READ items
CREATE POLICY "Public read access"
  ON jewellery_items
  FOR SELECT
  USING (true);

-- 5. RLS Policy: Only authenticated admin users can INSERT
CREATE POLICY "Admin can insert"
  ON jewellery_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. RLS Policy: Only authenticated admin users can UPDATE
CREATE POLICY "Admin can update"
  ON jewellery_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. RLS Policy: Only authenticated admin users can DELETE
CREATE POLICY "Admin can delete"
  ON jewellery_items
  FOR DELETE
  TO authenticated
  USING (true);

-- 8. Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
  BEFORE UPDATE ON jewellery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORAGE SETUP — Run these in SQL Editor too
-- ============================================================

-- 9. Create storage bucket for jewellery images (PUBLIC)
INSERT INTO storage.buckets (id, name, public)
VALUES ('jewellery-images', 'jewellery-images', true)
ON CONFLICT (id) DO NOTHING;

-- 10. Storage Policy: Anyone can view images
CREATE POLICY "Public image access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'jewellery-images');

-- 11. Storage Policy: Authenticated admin can upload
CREATE POLICY "Admin can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'jewellery-images');

-- 12. Storage Policy: Authenticated admin can update images
CREATE POLICY "Admin can update images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'jewellery-images');

-- 13. Storage Policy: Authenticated admin can delete images
CREATE POLICY "Admin can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'jewellery-images');

-- ============================================================
-- DONE! Your database is ready.
-- Now go to Authentication > Users and create your admin user.
-- ============================================================
