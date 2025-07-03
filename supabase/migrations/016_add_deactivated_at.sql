-- Add deactivated_at column to track when listings are no longer available
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- Create index for filtering active listings
CREATE INDEX IF NOT EXISTS idx_listings_deactivated_at ON listings(deactivated_at);

-- Comment
COMMENT ON COLUMN listings.deactivated_at IS 'Timestamp when the listing was detected as deactivated/unavailable';