-- Add missing columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS furnished BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wbs_required BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS utilities JSONB DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS postal_code TEXT;