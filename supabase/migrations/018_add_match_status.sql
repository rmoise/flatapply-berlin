-- Add status column to user_matches table
ALTER TABLE user_matches 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new' 
CHECK (status IN ('new', 'viewed', 'interested', 'applied', 'rejected', 'archived'));

-- Create index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_user_matches_status ON user_matches(status);

-- Update existing matches to have 'new' status (they already have this as default)
-- This is just for clarity, not strictly necessary
UPDATE user_matches 
SET status = 'new' 
WHERE status IS NULL;