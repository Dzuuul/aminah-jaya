-- Migration: Add Flash Sale tables
CREATE TABLE flash_sales (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255)    NOT NULL,
    description TEXT,
    start_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE flash_sale_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flash_sale_id   UUID NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sale_price      NUMERIC(12, 2) NOT NULL,
    stock_limit     INT             NOT NULL DEFAULT 0, -- kuota flash sale
    sold_count      INT             NOT NULL DEFAULT 0,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(flash_sale_id, product_id)
);

CREATE INDEX idx_flash_sales_active ON flash_sales(is_active, start_at, end_at);
CREATE INDEX idx_flash_sale_items_sale ON flash_sale_items(flash_sale_id);

CREATE TRIGGER trg_flash_sales_updated_at BEFORE UPDATE ON flash_sales FOR EACH ROW EXECUTE FUNCTION set_updated_at();
