-- Add deposit column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS deposit INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN listings.deposit IS 'Security deposit amount in euros';

-- Update existing listings to have a default deposit (3x monthly rent is common in Berlin)
UPDATE listings 
SET deposit = price * 3 
WHERE deposit IS NULL;