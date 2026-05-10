-- Migration: Add Blogs table
CREATE TABLE blogs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255)    NOT NULL,
    slug            VARCHAR(280)    NOT NULL UNIQUE,
    excerpt         TEXT,
    content         TEXT            NOT NULL,
    image_url       VARCHAR(500),
    cta_product_id  UUID            REFERENCES products(id) ON DELETE SET NULL,
    author_id       UUID            REFERENCES users(id) ON DELETE SET NULL,
    is_published    BOOLEAN         NOT NULL DEFAULT TRUE,
    published_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_published ON blogs(is_published, published_at DESC);

CREATE TRIGGER trg_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
