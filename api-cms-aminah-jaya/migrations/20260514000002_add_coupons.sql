-- Add coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DOUBLE PRECISION NOT NULL,
    min_purchase DOUBLE PRECISION DEFAULT 0,
    max_discount DOUBLE PRECISION, -- For percentage type
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit INTEGER, -- NULL means unlimited
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
CREATE TRIGGER set_timestamp_coupons
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- Index for code search
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active_dates ON coupons(is_active, start_at, end_at);
