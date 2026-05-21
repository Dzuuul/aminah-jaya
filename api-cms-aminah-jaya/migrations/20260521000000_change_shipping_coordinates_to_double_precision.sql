-- Alter shipping coordinates columns to double precision for Rust f64 compatibility
ALTER TABLE storefront_customers
    ALTER COLUMN shipping_lat TYPE DOUBLE PRECISION USING shipping_lat::DOUBLE PRECISION,
    ALTER COLUMN shipping_lng TYPE DOUBLE PRECISION USING shipping_lng::DOUBLE PRECISION;
