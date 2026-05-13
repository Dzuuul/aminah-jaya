-- Migration: Add indexes for flash_sales and blogs tables

-- Index on flash_sales start_at for faster range queries
CREATE INDEX IF NOT EXISTS idx_flash_sales_start_at ON flash_sales(start_at);

-- Index on flash_sales end_at for faster range queries
CREATE INDEX IF NOT EXISTS idx_flash_sales_end_at ON flash_sales(end_at);

-- Composite index for active flash sales queries (is_active, start_at, end_at)
CREATE INDEX IF NOT EXISTS idx_flash_sales_active_composite ON flash_sales(is_active, start_at, end_at);

-- Index on blogs is_published for filtering published blogs
CREATE INDEX IF NOT EXISTS idx_blogs_is_published ON blogs(is_published);

-- Index on blogs published_at for ordering recent blogs
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC);
