-- Add available_to column to track end date for temporary rentals
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS available_to date;

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_listings_available_dates 
ON listings(available_from, available_to) 
WHERE deactivated_at IS NULL;

-- Comment
COMMENT ON COLUMN listings.available_to IS 'End date for temporary/limited rentals (Zwischenmiete)';