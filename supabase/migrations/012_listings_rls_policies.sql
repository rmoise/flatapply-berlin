-- Enable RLS on listings table
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (for scraping service)
CREATE POLICY "Anyone can read listings" ON listings
  FOR SELECT
  USING (true);

-- Allow service role to insert/update listings
CREATE POLICY "Service role can insert listings" ON listings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update listings" ON listings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read listings
CREATE POLICY "Authenticated users can read listings" ON listings
  FOR SELECT
  TO authenticated
  USING (true);