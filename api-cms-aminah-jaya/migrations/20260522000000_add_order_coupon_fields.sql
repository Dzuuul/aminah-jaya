-- Add coupon metadata to orders
ALTER TABLE orders
    ADD COLUMN coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    ADD COLUMN coupon_code VARCHAR(50),
    ADD COLUMN discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
