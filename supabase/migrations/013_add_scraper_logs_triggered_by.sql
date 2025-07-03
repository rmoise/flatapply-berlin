-- Add triggered_by column to scraper_logs table
ALTER TABLE scraper_logs 
ADD COLUMN IF NOT EXISTS triggered_by UUID REFERENCES profiles(id);

-- Add comment
COMMENT ON COLUMN scraper_logs.triggered_by IS 'User who triggered manual scraping';