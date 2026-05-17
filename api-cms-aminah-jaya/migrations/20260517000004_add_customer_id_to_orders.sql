-- Add customer_id to orders table
ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES storefront_customers(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
