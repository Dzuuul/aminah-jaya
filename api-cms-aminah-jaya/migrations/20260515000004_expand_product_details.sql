-- Expand products table for detailed frontend needs
ALTER TABLE products
    ADD COLUMN subtitle            VARCHAR(255),
    ADD COLUMN rating              NUMERIC(3, 2) DEFAULT 4.9,
    ADD COLUMN reviews_count       INT DEFAULT 0,
    ADD COLUMN sold_count          VARCHAR(50),
    ADD COLUMN certifications      JSONB DEFAULT '[]',
    ADD COLUMN variants_chips      JSONB DEFAULT '[]', -- chip selection on frontend
    ADD COLUMN ingredients         JSONB DEFAULT '[]',
    ADD COLUMN how_to_use          JSONB DEFAULT '[]',
    ADD COLUMN story               JSONB DEFAULT '{}',
    ADD COLUMN macro_detail        JSONB DEFAULT '{}',
    ADD COLUMN benefits            JSONB DEFAULT '[]',
    ADD COLUMN dosage              JSONB DEFAULT '[]',
    ADD COLUMN discount_label      VARCHAR(50);

-- Update existing column comments or add new ones
COMMENT ON COLUMN products.subtitle IS 'Subtitle for product, e.g. "3X Brightening Injection Formula"';
COMMENT ON COLUMN products.rating IS 'Average rating of the product';
COMMENT ON COLUMN products.reviews_count IS 'Total number of reviews';
COMMENT ON COLUMN products.sold_count IS 'Display text for sold count, e.g. "13rb+"';
COMMENT ON COLUMN products.certifications IS 'Array of certification strings: ["BPOM RI", "HALAL MUI"]';
COMMENT ON COLUMN products.variants_chips IS 'Array of variant options: ["Pomegranate", "Strawberry"]';
COMMENT ON COLUMN products.ingredients IS 'JSON array of objects: [{"name": "...", "desc": "..."}]';
COMMENT ON COLUMN products.how_to_use IS 'JSON array of objects: [{"num": 1, "text": "..."}]';
COMMENT ON COLUMN products.story IS 'JSON object: {"heading": "...", "subheading": "...", "image": "..."}';
COMMENT ON COLUMN products.macro_detail IS 'JSON object: {"title": "...", "desc": "...", "image": "...", "specs": [...]}';
COMMENT ON COLUMN products.benefits IS 'JSON array of objects: [{"name": "...", "icon": "..."}]';
COMMENT ON COLUMN products.dosage IS 'JSON array of objects: [{"goal": "...", "dose": "...", "duration": "...", "time": "..."}]';
