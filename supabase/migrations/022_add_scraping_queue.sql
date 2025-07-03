-- Create scraping queue table for universal scraper
CREATE TABLE IF NOT EXISTS scraping_queue (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Data needed flags
  data_needed JSONB DEFAULT '{"basic": true, "description": true, "contact": true, "images": true, "amenities": true}'::jsonb,
  
  -- Extracted data (stored temporarily)
  extracted_data JSONB,
  
  -- Processing timestamps
  processing_started_at TIMESTAMPTZ,
  processing_ended_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(platform, url)
);

-- Indexes for efficient queries
CREATE INDEX idx_scraping_queue_status ON scraping_queue(status);
CREATE INDEX idx_scraping_queue_platform ON scraping_queue(platform);
CREATE INDEX idx_scraping_queue_priority ON scraping_queue(priority DESC);
CREATE INDEX idx_scraping_queue_created_at ON scraping_queue(created_at);
CREATE INDEX idx_scraping_queue_processing ON scraping_queue(status, attempts, last_attempt);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scraping_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_scraping_queue_updated_at
  BEFORE UPDATE ON scraping_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_scraping_queue_updated_at();

-- RLS policies
ALTER TABLE scraping_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage queue" ON scraping_queue
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- View for queue statistics
CREATE OR REPLACE VIEW scraping_queue_stats AS
SELECT 
  platform,
  status,
  COUNT(*) as count,
  AVG(attempts) as avg_attempts,
  MAX(priority) as max_priority,
  MIN(created_at) as oldest_item,
  COUNT(CASE WHEN data_needed->>'description' = 'true' THEN 1 END) as needs_description,
  COUNT(CASE WHEN data_needed->>'images' = 'true' THEN 1 END) as needs_images,
  COUNT(CASE WHEN data_needed->>'contact' = 'true' THEN 1 END) as needs_contact
FROM scraping_queue
GROUP BY platform, status;

-- Function to enqueue discovery for a platform
CREATE OR REPLACE FUNCTION enqueue_platform_discovery(
  p_platform TEXT,
  p_base_url TEXT,
  p_priority INTEGER DEFAULT 1000
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO scraping_queue (
    id,
    platform,
    url,
    priority,
    data_needed,
    metadata
  )
  VALUES (
    'disc_' || p_platform || '_' || extract(epoch from now())::text,
    p_platform,
    p_base_url,
    p_priority,
    '{"basic": true, "description": false, "contact": false, "images": false, "amenities": false}'::jsonb,
    jsonb_build_object('type', 'discovery', 'timestamp', now())
  )
  ON CONFLICT (platform, url) DO UPDATE
  SET priority = GREATEST(scraping_queue.priority, EXCLUDED.priority),
      updated_at = NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;