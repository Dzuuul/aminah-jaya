-- Add user_id and contact_id to notifications table
ALTER TABLE notifications ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_contact_id ON notifications(contact_id);

-- Update comment for clarification
COMMENT ON COLUMN notifications.type IS 'order, stock, system, chat, etc.';
