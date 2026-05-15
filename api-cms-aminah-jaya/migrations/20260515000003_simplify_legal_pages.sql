-- Remove English columns from legal_pages
ALTER TABLE legal_pages DROP COLUMN IF EXISTS title_en;
ALTER TABLE legal_pages DROP COLUMN IF EXISTS content_en;
