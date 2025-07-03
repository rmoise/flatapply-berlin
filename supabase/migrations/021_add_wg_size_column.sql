-- Add WG size column to store number of people in shared apartments
-- 2er WG = 2, 3er WG = 3, etc.

ALTER TABLE listings 
ADD COLUMN wg_size INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN listings.wg_size IS 'Number of people in shared apartment (2er WG, 3er WG, etc.)';

-- Create index for querying WG listings
CREATE INDEX idx_listings_wg_size ON listings(wg_size) WHERE wg_size IS NOT NULL;