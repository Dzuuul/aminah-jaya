-- Make title and subtitle optional in banners table
ALTER TABLE banners ALTER COLUMN title DROP NOT NULL;
ALTER TABLE banners ALTER COLUMN subtitle DROP NOT NULL;
