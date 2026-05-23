-- Biteship shipping integration fields on orders
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS biteship_order_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS biteship_tracking_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS biteship_draft_order_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS shipping_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS shipping_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS shipping_area_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS courier_company VARCHAR(50),
    ADD COLUMN IF NOT EXISTS courier_service VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_orders_biteship_order_id ON orders(biteship_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_biteship_tracking_id ON orders(biteship_tracking_id);
