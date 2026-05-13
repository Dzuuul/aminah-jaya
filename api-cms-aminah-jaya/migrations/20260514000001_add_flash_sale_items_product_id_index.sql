-- Migration: Add index on flash_sale_items product_id
CREATE INDEX idx_flash_sale_items_product_id ON flash_sale_items(product_id);
