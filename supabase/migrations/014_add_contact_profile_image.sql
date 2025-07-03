-- Add contact_profile_image column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS contact_profile_image TEXT;

-- Add comment for clarity
COMMENT ON COLUMN listings.contact_profile_image IS 'Profile/avatar image URL of the contact person';