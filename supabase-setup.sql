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

-- Categories are data managed from the admin panel. IDs intentionally match
-- the existing jewellery_items.category values, so current products stay valid.
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '💎',
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, label)
);

-- Optional for every product: existing category-only items need no backfill.
ALTER TABLE jewellery_items
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

INSERT INTO categories (id, label, icon, description, sort_order) VALUES
  ('rings', 'Rings', '💍', 'Elegant rings for every occasion', 1),
  ('earrings', 'Earrings', '✨', 'Beautiful earrings to complement your style', 2),
  ('pendants', 'Pendants', '🔮', 'Exquisite pendants with timeless appeal', 3),
  ('necklaces', 'Necklaces', '📿', 'Stunning necklaces for a graceful look', 4),
  ('bangles-bracelets', 'Bangles & Bracelets', '🌟', 'Charming bangles and bracelets', 5),
  ('chains', 'Chains', '⛓️', 'Fine chains in various styles', 6),
  ('haram', 'Haram', '📿', 'Traditional haram necklaces and statement pieces', 7),
  ('special-ornaments', 'Special Ornaments', '👑', 'Unique and special ornament pieces', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, label, icon, description)
SELECT DISTINCT ji.category, initcap(replace(ji.category, '-', ' ')), '💎', ''
FROM jewellery_items AS ji
WHERE NOT EXISTS (SELECT 1 FROM categories AS c WHERE c.id = ji.category)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories (category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_jewellery_subcategory ON jewellery_items (subcategory_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Admin manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public read subcategories" ON subcategories;
CREATE POLICY "Public read subcategories" ON subcategories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage subcategories" ON subcategories;
CREATE POLICY "Admin manage subcategories" ON subcategories FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
