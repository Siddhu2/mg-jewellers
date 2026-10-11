-- Category / subcategory support for an existing MG Jewellers database.
-- Run once in Supabase Dashboard > SQL Editor before deploying the updated site.

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

-- Preserve any other legacy category IDs already used by products (for example,
-- a category renamed in the front end before this migration was applied).
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
