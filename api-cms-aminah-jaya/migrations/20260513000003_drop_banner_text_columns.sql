-- Drop title, subtitle, and cta_text columns from banners table
ALTER TABLE banners DROP COLUMN IF EXISTS title;
ALTER TABLE banners DROP COLUMN IF EXISTS subtitle;
ALTER TABLE banners DROP COLUMN IF EXISTS cta_text;
