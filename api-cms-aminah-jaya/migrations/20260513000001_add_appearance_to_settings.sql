-- Add appearance mode to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS appearance_mode TEXT NOT NULL DEFAULT 'light';
