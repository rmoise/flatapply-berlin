-- Add contact phone and email columns to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add indexes for searching
CREATE INDEX IF NOT EXISTS idx_listings_contact_phone ON listings(contact_phone);
CREATE INDEX IF NOT EXISTS idx_listings_contact_email ON listings(contact_email);