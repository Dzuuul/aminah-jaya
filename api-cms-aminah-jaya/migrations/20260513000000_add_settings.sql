-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    store_name TEXT NOT NULL DEFAULT 'Aminah Jaya',
    store_email TEXT NOT NULL DEFAULT 'admin@aminahjaya.com',
    phone_number TEXT NOT NULL DEFAULT '0812-3456-7890',
    store_description TEXT,
    currency TEXT NOT NULL DEFAULT 'IDR',
    language TEXT NOT NULL DEFAULT 'id',
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    order_notifications BOOLEAN NOT NULL DEFAULT true,
    low_stock_notifications BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings if none exist
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
