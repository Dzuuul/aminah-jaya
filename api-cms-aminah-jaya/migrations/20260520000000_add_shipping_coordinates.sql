-- Add shipping coordinates to storefront_customers table
ALTER TABLE storefront_customers 
ADD COLUMN shipping_lat NUMERIC(10, 6),
ADD COLUMN shipping_lng NUMERIC(10, 6);

-- Create index for faster lookups by location
CREATE INDEX idx_storefront_customers_shipping_coords ON storefront_customers(shipping_lat, shipping_lng);
