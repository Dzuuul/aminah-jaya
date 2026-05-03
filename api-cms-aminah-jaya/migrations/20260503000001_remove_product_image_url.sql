-- Remove image_url from products and use product_images instead
ALTER TABLE products DROP COLUMN IF EXISTS image_url;
