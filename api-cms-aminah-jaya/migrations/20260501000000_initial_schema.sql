-- ============================================================
--  AMINAH JAYA — Complete PostgreSQL Migration
--  Single Database: CMS + Landing Page + WhatsApp Webhook
--  Compatible: PostgreSQL 14+
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- untuk full-text search produk

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'editor');

CREATE TYPE page_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock');

CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned', 'expired');

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');

CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'template', 'interactive', 'location', 'reaction');

CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');

CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'negotiating', 'closed_won', 'closed_lost');

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TYPE payment_status AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded');

CREATE TYPE payment_method AS ENUM ('cod', 'transfer', 'qris', 'other');

CREATE TYPE event_type AS ENUM ('page_view', 'product_view', 'wa_click', 'chat_start', 'lead_created', 'order_created', 'broadcast_sent');

CREATE TYPE broadcast_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'cancelled');

CREATE TYPE recipient_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');

-- ============================================================
-- SCHEMA: CMS & PRODUK
-- ============================================================

-- 1. USERS (admin CMS)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100)        NOT NULL,
    email           VARCHAR(255)        NOT NULL UNIQUE,
    password_hash   VARCHAR(255)        NOT NULL,
    role            user_role           NOT NULL DEFAULT 'editor',
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. SITE_SETTINGS (konfigurasi global toko)
CREATE TABLE site_settings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key         VARCHAR(100)    NOT NULL UNIQUE,
    value       TEXT,
    type        VARCHAR(20)     NOT NULL DEFAULT 'string',  -- string, json, boolean, number
    label       VARCHAR(150),
    description TEXT,
    updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO site_settings (key, value, type, label) VALUES
    ('store_name',          'Aminah Jaya Store',    'string',  'Nama Toko'),
    ('store_wa_number',     '628123456789',         'string',  'Nomor WhatsApp Toko'),
    ('store_wa_token',      '',                     'string',  'WhatsApp API Token'),
    ('store_wa_phone_id',   '',                     'string',  'WhatsApp Phone ID'),
    ('store_wa_waba_id',    '',                     'string',  'WhatsApp Business Account ID'),
    ('store_wa_verify_token','',                    'string',  'Webhook Verify Token'),
    ('meta_pixel_id',       '',                     'string',  'Meta Pixel ID'),
    ('google_analytics_id', '',                     'string',  'Google Analytics ID'),
    ('store_address',       '',                     'string',  'Alamat Toko'),
    ('store_city',          '',                     'string',  'Kota'),
    ('store_instagram',     '',                     'string',  'Instagram Handle'),
    ('store_tiktok',        '',                     'string',  'TikTok Handle'),
    ('chatbot_enabled',     'true',                 'boolean', 'Aktifkan Chatbot'),
    ('chatbot_greeting',    'Halo! Selamat datang di Aminah Jaya 👋', 'string', 'Pesan Sambutan Chatbot'),
    ('shipping_cost',       '0',                    'number',  'Biaya Pengiriman Default');

-- 3. CATEGORIES
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    name        VARCHAR(100)    NOT NULL,
    slug        VARCHAR(120)    NOT NULL UNIQUE,
    description TEXT,
    image_url   VARCHAR(500),
    sort_order  INT             NOT NULL DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    name                VARCHAR(255)        NOT NULL,
    slug                VARCHAR(280)        NOT NULL UNIQUE,
    description         TEXT,
    short_description   VARCHAR(500),
    price               NUMERIC(12, 2)      NOT NULL DEFAULT 0,
    price_compare       NUMERIC(12, 2),                     -- harga coret
    weight_gram         INT                 NOT NULL DEFAULT 0,
    stock               INT                 NOT NULL DEFAULT 0,
    sku                 VARCHAR(100)        UNIQUE,
    status              product_status      NOT NULL DEFAULT 'active',
    is_featured         BOOLEAN             NOT NULL DEFAULT FALSE,
    wa_message_template TEXT,                               -- template pesan WA per produk
    meta_title          VARCHAR(255),
    meta_description    VARCHAR(500),
    sort_order          INT                 NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. PRODUCT_IMAGES
CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         VARCHAR(500)    NOT NULL,
    alt_text    VARCHAR(255),
    sort_order  INT             NOT NULL DEFAULT 0,
    is_primary  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Pastikan hanya satu primary image per produk
CREATE UNIQUE INDEX idx_product_images_primary
    ON product_images(product_id)
    WHERE is_primary = TRUE;

-- 6. PRODUCT_VARIANTS
CREATE TABLE product_variants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name        VARCHAR(100)    NOT NULL,   -- e.g. "Warna", "Ukuran"
    value       VARCHAR(100)    NOT NULL,   -- e.g. "Hitam", "XL"
    price_adj   NUMERIC(12, 2)  NOT NULL DEFAULT 0, -- penyesuaian harga dari base
    stock       INT             NOT NULL DEFAULT 0,
    sku         VARCHAR(100)    UNIQUE,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order  INT             NOT NULL DEFAULT 0
);

-- 7. PAGES (landing content: About, etc.)
CREATE TABLE pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    title           VARCHAR(255)    NOT NULL,
    slug            VARCHAR(280)    NOT NULL UNIQUE,
    content         TEXT,
    status          page_status     NOT NULL DEFAULT 'draft',
    meta_title      VARCHAR(255),
    meta_description VARCHAR(500),
    published_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. BANNERS (hero/promo landing page)
CREATE TABLE banners (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(255)    NOT NULL,
    subtitle    VARCHAR(500),
    image_url   VARCHAR(500)    NOT NULL,
    link_url    VARCHAR(500),
    cta_text    VARCHAR(100),
    sort_order  INT             NOT NULL DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    starts_at   TIMESTAMP WITH TIME ZONE,
    ends_at     TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. TESTIMONIALS
CREATE TABLE testimonials (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    customer_name   VARCHAR(100)    NOT NULL,
    customer_city   VARCHAR(100),
    rating          SMALLINT        NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    content         TEXT            NOT NULL,
    image_url       VARCHAR(500),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCHEMA: WHATSAPP & CHATBOT
-- ============================================================

-- 10. CONTACTS (user WhatsApp)
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wa_phone        VARCHAR(20)     NOT NULL UNIQUE,  -- format: 628xxx (tanpa +)
    wa_name         VARCHAR(150),                     -- display name dari WA
    display_name    VARCHAR(150),                     -- nama yang diisi user ke chatbot
    email           VARCHAR(255),
    city            VARCHAR(100),
    province        VARCHAR(100),
    is_blocked      BOOLEAN         NOT NULL DEFAULT FALSE,
    tags            TEXT[]          DEFAULT '{}',     -- label/tag segmentasi
    notes           TEXT,                             -- catatan internal admin
    first_seen_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. CHATBOT_FLOWS (konfigurasi alur chatbot)
CREATE TABLE chatbot_flows (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(150)    NOT NULL,
    trigger_keyword  VARCHAR(100),   -- keyword pemicu, NULL = default flow
    flow_steps       JSONB           NOT NULL DEFAULT '[]',
    -- Contoh flow_steps:
    -- [
    --   {"step": "greeting", "message": "Halo! ...", "options": [{"label": "1. Lihat Produk", "next": "product_list"}]},
    --   {"step": "product_list", "message": "Pilih kategori:", "options": [...]}
    -- ]
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    priority         INT             NOT NULL DEFAULT 0,
    created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. CHAT_SESSIONS
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    flow_id         UUID REFERENCES chatbot_flows(id) ON DELETE SET NULL,
    status          session_status   NOT NULL DEFAULT 'active',
    current_step    VARCHAR(100),
    context_data    JSONB            NOT NULL DEFAULT '{}',
    -- Contoh context_data:
    -- {"selected_category": "gamis", "selected_product_id": "uuid", "step_history": ["greeting","product_list"]}
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMP WITH TIME ZONE,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. MESSAGES
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    wa_message_id   VARCHAR(255)        UNIQUE,  -- ID dari Meta API
    direction       message_direction   NOT NULL,
    type            message_type        NOT NULL DEFAULT 'text',
    content         TEXT,
    media_url       VARCHAR(500),
    raw_payload     JSONB,              -- raw webhook payload untuk audit/debug
    status          message_status      NOT NULL DEFAULT 'sent',
    sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    delivered_at    TIMESTAMP WITH TIME ZONE,
    read_at         TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- SCHEMA: LEADS & ORDERS
-- ============================================================

-- 14. LEADS
CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    session_id          UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    status              lead_status     NOT NULL DEFAULT 'new',
    customer_name       VARCHAR(150),
    customer_address    TEXT,
    quantity            INT             NOT NULL DEFAULT 1,
    variant_id          UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    notes               TEXT,
    estimated_value     NUMERIC(12, 2),
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    closed_at           TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 15. ORDERS
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    order_number        VARCHAR(50)     NOT NULL UNIQUE,  -- e.g. AJ-20240101-0001
    status              order_status    NOT NULL DEFAULT 'pending',
    total_amount        NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    shipping_cost       NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    grand_total         NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    payment_method      payment_method,
    payment_status      payment_status  NOT NULL DEFAULT 'unpaid',
    payment_proof_url   VARCHAR(500),
    shipping_address    TEXT,
    shipping_city       VARCHAR(100),
    shipping_province   VARCHAR(100),
    tracking_number     VARCHAR(100),
    courier             VARCHAR(100),
    notes               TEXT,
    ordered_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    confirmed_at        TIMESTAMP WITH TIME ZONE,
    shipped_at          TIMESTAMP WITH TIME ZONE,
    delivered_at        TIMESTAMP WITH TIME ZONE,
    cancelled_at        TIMESTAMP WITH TIME ZONE,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Auto-generate order number
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'AJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();

-- 16. ORDER_ITEMS
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name    VARCHAR(255)    NOT NULL,  -- snapshot nama produk saat order
    variant_label   VARCHAR(200),              -- snapshot label varian
    quantity        INT             NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12, 2)  NOT NULL,
    subtotal        NUMERIC(12, 2)  NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCHEMA: TRACKING & ANALYTICS
-- ============================================================

-- 17. EVENTS
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    session_id      UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    type            event_type      NOT NULL,
    source          VARCHAR(100),   -- 'landing_page', 'whatsapp', 'admin'
    utm_source      VARCHAR(100),
    utm_medium      VARCHAR(100),
    utm_campaign    VARCHAR(100),
    utm_content     VARCHAR(100),
    referrer        VARCHAR(500),
    metadata        JSONB           DEFAULT '{}',
    ip_address      INET,
    user_agent      TEXT,
    occurred_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 18. WEBHOOK_LOGS (audit semua incoming dari Meta)
CREATE TABLE webhook_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider        VARCHAR(50)     NOT NULL DEFAULT 'meta',
    event_type      VARCHAR(100),
    payload         JSONB           NOT NULL DEFAULT '{}',
    response_status INT,
    error_message   TEXT,
    processed       BOOLEAN         NOT NULL DEFAULT FALSE,
    received_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- SCHEMA: BROADCAST
-- ============================================================

-- 19. BROADCAST_CAMPAIGNS
CREATE TABLE broadcast_campaigns (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    name                VARCHAR(255)        NOT NULL,
    message_template    TEXT                NOT NULL,
    media_url           VARCHAR(500),
    target_filter       JSONB               DEFAULT '{}',
    -- Contoh: {"tags": ["vip"], "city": "Jakarta", "last_order_before": "2024-01-01"}
    status              broadcast_status    NOT NULL DEFAULT 'draft',
    total_recipients    INT                 NOT NULL DEFAULT 0,
    sent_count          INT                 NOT NULL DEFAULT 0,
    delivered_count     INT                 NOT NULL DEFAULT 0,
    read_count          INT                 NOT NULL DEFAULT 0,
    failed_count        INT                 NOT NULL DEFAULT 0,
    scheduled_at        TIMESTAMP WITH TIME ZONE,
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 20. BROADCAST_RECIPIENTS
CREATE TABLE broadcast_recipients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id     UUID NOT NULL REFERENCES broadcast_campaigns(id) ON DELETE CASCADE,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status          recipient_status    NOT NULL DEFAULT 'queued',
    wa_message_id   VARCHAR(255),
    error_message   TEXT,
    sent_at         TIMESTAMP WITH TIME ZONE,
    delivered_at    TIMESTAMP WITH TIME ZONE,
    read_at         TIMESTAMP WITH TIME ZONE,
    UNIQUE(campaign_id, contact_id)
);

-- ============================================================
-- INDEXES (PERFORMANCE)
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('indonesian', name || ' ' || COALESCE(short_description, '')));

-- Product images & variants
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- Contacts
CREATE INDEX idx_contacts_wa_phone ON contacts(wa_phone);
CREATE INDEX idx_contacts_tags ON contacts USING gin(tags);
CREATE INDEX idx_contacts_last_seen ON contacts(last_seen_at DESC);

-- Chat sessions
CREATE INDEX idx_chat_sessions_contact ON chat_sessions(contact_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(contact_id, status) WHERE status = 'active';

-- Messages
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_contact ON messages(contact_id);
CREATE INDEX idx_messages_wa_id ON messages(wa_message_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);

-- Leads
CREATE INDEX idx_leads_contact ON leads(contact_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_product ON leads(product_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- Orders
CREATE INDEX idx_orders_contact ON orders(contact_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_ordered_at ON orders(ordered_at DESC);

-- Order items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Events
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_contact ON events(contact_id);
CREATE INDEX idx_events_product ON events(product_id);
CREATE INDEX idx_events_occurred ON events(occurred_at DESC);
CREATE INDEX idx_events_utm ON events(utm_source, utm_campaign);

-- Webhook logs
CREATE INDEX idx_webhook_logs_received ON webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);

-- Broadcast
CREATE INDEX idx_broadcast_recipients_campaign ON broadcast_recipients(campaign_id);
CREATE INDEX idx_broadcast_recipients_status ON broadcast_recipients(campaign_id, status);

-- ============================================================
-- FUNCTIONS & TRIGGERS (updated_at otomatis)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at             BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at        BEFORE UPDATE ON categories        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at          BEFORE UPDATE ON products          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pages_updated_at             BEFORE UPDATE ON pages             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contacts_updated_at          BEFORE UPDATE ON contacts          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_chat_sessions_updated_at     BEFORE UPDATE ON chat_sessions     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_chatbot_flows_updated_at     BEFORE UPDATE ON chatbot_flows     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leads_updated_at             BEFORE UPDATE ON leads             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at            BEFORE UPDATE ON orders            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_broadcast_campaigns_updated  BEFORE UPDATE ON broadcast_campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- VIEWS (siap pakai untuk dashboard)
-- ============================================================

-- Dashboard ringkasan harian
CREATE OR REPLACE VIEW vw_daily_summary AS
SELECT
    DATE(occurred_at)                                           AS date,
    COUNT(*) FILTER (WHERE type = 'page_view')                  AS page_views,
    COUNT(*) FILTER (WHERE type = 'product_view')               AS product_views,
    COUNT(*) FILTER (WHERE type = 'wa_click')                   AS wa_clicks,
    COUNT(*) FILTER (WHERE type = 'lead_created')               AS leads_created,
    COUNT(*) FILTER (WHERE type = 'order_created')              AS orders_created
FROM events
GROUP BY DATE(occurred_at)
ORDER BY date DESC;

-- Produk terpopuler berdasarkan klik WA
CREATE OR REPLACE VIEW vw_popular_products AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    c.name                                                      AS category_name,
    COUNT(e.id) FILTER (WHERE e.type = 'wa_click')              AS wa_clicks,
    COUNT(e.id) FILTER (WHERE e.type = 'product_view')          AS product_views,
    COUNT(DISTINCT l.id)                                        AS total_leads,
    COUNT(DISTINCT oi.order_id)                                 AS total_orders
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN events e ON e.product_id = p.id
LEFT JOIN leads l ON l.product_id = p.id
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY p.id, p.name, p.slug, p.price, c.name
ORDER BY wa_clicks DESC;

-- Konversi funnel
CREATE OR REPLACE VIEW vw_conversion_funnel AS
SELECT
    DATE_TRUNC('week', e.occurred_at)                           AS week,
    COUNT(DISTINCT e.id) FILTER (WHERE e.type = 'product_view') AS product_views,
    COUNT(DISTINCT e.id) FILTER (WHERE e.type = 'wa_click')     AS wa_clicks,
    COUNT(DISTINCT l.id)                                        AS leads,
    COUNT(DISTINCT o.id)                                        AS orders,
    ROUND(
        100.0 * COUNT(DISTINCT e.id) FILTER (WHERE e.type = 'wa_click')
        / NULLIF(COUNT(DISTINCT e.id) FILTER (WHERE e.type = 'product_view'), 0), 2
    )                                                           AS view_to_wa_pct,
    ROUND(
        100.0 * COUNT(DISTINCT o.id)
        / NULLIF(COUNT(DISTINCT l.id), 0), 2
    )                                                           AS lead_to_order_pct
FROM events e
LEFT JOIN leads l ON l.session_id = e.session_id
LEFT JOIN orders o ON o.lead_id = l.id
GROUP BY DATE_TRUNC('week', e.occurred_at)
ORDER BY week DESC;

-- Ringkasan kontak aktif
CREATE OR REPLACE VIEW vw_contact_summary AS
SELECT
    c.id,
    c.wa_phone,
    c.display_name,
    c.wa_name,
    c.city,
    c.tags,
    c.last_seen_at,
    COUNT(DISTINCT s.id)                                        AS total_sessions,
    COUNT(DISTINCT l.id)                                        AS total_leads,
    COUNT(DISTINCT o.id)                                        AS total_orders,
    COALESCE(SUM(o.grand_total) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_spent
FROM contacts c
LEFT JOIN chat_sessions s ON s.contact_id = c.id
LEFT JOIN leads l ON l.contact_id = c.id
LEFT JOIN orders o ON o.contact_id = c.id
GROUP BY c.id, c.wa_phone, c.display_name, c.wa_name, c.city, c.tags, c.last_seen_at;

-- Revenue bulanan
CREATE OR REPLACE VIEW vw_monthly_revenue AS
SELECT
    DATE_TRUNC('month', ordered_at)                             AS month,
    COUNT(*)                                                    AS total_orders,
    COUNT(*) FILTER (WHERE payment_status = 'paid')             AS paid_orders,
    SUM(grand_total) FILTER (WHERE payment_status = 'paid')     AS revenue,
    AVG(grand_total) FILTER (WHERE payment_status = 'paid')     AS avg_order_value
FROM orders
GROUP BY DATE_TRUNC('month', ordered_at)
ORDER BY month DESC;

-- ============================================================
-- SEED DATA (untuk development)
-- ============================================================

-- Default admin user (password: admin123 — ganti di production!)
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Super Admin', 'admin@aminahjaya.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUBufEMRPBT1W.qK3vz.Nz9Oi', 'superadmin');

-- Default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Gamis',       'gamis',        'Koleksi gamis premium',        1),
    ('Skincare',    'skincare',     'Produk perawatan kulit',       2),
    ('Aksesoris',   'aksesoris',    'Aksesoris fashion muslim',     3);

-- Default chatbot flow
INSERT INTO chatbot_flows (name, trigger_keyword, flow_steps, is_active, priority) VALUES
(
    'Main Flow',
    NULL,
    '[
        {
            "step": "greeting",
            "message": "Halo! 👋 Selamat datang di *Aminah Jaya Store*\n\nSilakan pilih menu:",
            "options": [
                {"label": "1️⃣ Lihat Produk", "next": "product_category"},
                {"label": "2️⃣ Tanya Harga", "next": "ask_price"},
                {"label": "3️⃣ Cara Order", "next": "how_to_order"}
            ]
        },
        {
            "step": "product_category",
            "message": "Pilih kategori produk yang kamu minati:",
            "options": [
                {"label": "👗 Gamis", "next": "product_list", "filter": "gamis"},
                {"label": "✨ Skincare", "next": "product_list", "filter": "skincare"},
                {"label": "💎 Aksesoris", "next": "product_list", "filter": "aksesoris"}
            ]
        },
        {
            "step": "how_to_order",
            "message": "Cara order di Aminah Jaya:\n\n1. Pilih produk yang kamu mau\n2. Beritahu nama & alamat lengkap\n3. Konfirmasi pesanan\n4. Transfer pembayaran\n5. Produk dikirim! 📦\n\nAda yang bisa kami bantu?",
            "options": [
                {"label": "🛍️ Lihat Produk", "next": "product_category"},
                {"label": "💬 Chat Admin", "next": "handoff_admin"}
            ]
        },
        {
            "step": "collect_order",
            "message": "Baik! Untuk proses order, mohon isi data berikut:\n\nNama lengkap?",
            "collect": "customer_name",
            "next": "collect_address"
        },
        {
            "step": "collect_address",
            "message": "Alamat pengiriman lengkap? (termasuk kota & kode pos)",
            "collect": "customer_address",
            "next": "order_summary"
        }
    ]'::jsonb,
    TRUE,
    10
);

-- ============================================================
-- COMMENTS (dokumentasi kolom penting)
-- ============================================================

COMMENT ON TABLE contacts IS 'Semua kontak WhatsApp yang pernah interaksi dengan toko';
COMMENT ON TABLE chat_sessions IS 'Sesi percakapan chatbot per kontak. context_data menyimpan state chatbot (step, pilihan produk, dll)';
COMMENT ON TABLE messages IS 'Semua pesan masuk/keluar WhatsApp. raw_payload untuk audit webhook Meta';
COMMENT ON TABLE events IS 'Tracking semua aktivitas user: klik produk, buka WA, buat order, dll';
COMMENT ON TABLE webhook_logs IS 'Log mentah semua webhook dari Meta API sebelum diproses';
COMMENT ON COLUMN products.wa_message_template IS 'Template pesan WA yang dikirim saat user klik tombol WA di halaman produk ini';
COMMENT ON COLUMN chat_sessions.context_data IS 'State chatbot: {"selected_category":"gamis","selected_product_id":"uuid","step_history":["greeting"]}';
COMMENT ON COLUMN contacts.tags IS 'Array label untuk segmentasi broadcast: ["vip","repeat_buyer","jakarta"]';
COMMENT ON COLUMN site_settings.key IS 'Keys: store_wa_number, store_wa_token, store_wa_phone_id, chatbot_enabled, dll';