-- Cache tarif ongkir Biteship per rute + bucket berat (kg)
CREATE TABLE IF NOT EXISTS shipping_rate_cache (
    cache_key VARCHAR(512) PRIMARY KEY,
    origin_key VARCHAR(128) NOT NULL,
    destination_key VARCHAR(256) NOT NULL,
    weight_kg INTEGER NOT NULL CHECK (weight_kg > 0),
    couriers VARCHAR(512) NOT NULL,
    rates_json JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rate_cache_lookup
    ON shipping_rate_cache (origin_key, destination_key, weight_kg);

CREATE INDEX IF NOT EXISTS idx_shipping_rate_cache_expires
    ON shipping_rate_cache (expires_at);
