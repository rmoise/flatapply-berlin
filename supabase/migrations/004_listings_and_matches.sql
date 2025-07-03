-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('wg_gesucht', 'immoscout24', 'kleinanzeigen', 'immowelt', 'immonet')),
  external_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  warm_rent INTEGER,
  size_sqm INTEGER,
  rooms DECIMAL,
  floor INTEGER,
  total_floors INTEGER,
  available_from DATE,
  district TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  property_type TEXT,
  images JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  allows_auto_apply BOOLEAN DEFAULT false,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- Create user_matches table
CREATE TABLE IF NOT EXISTS user_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  match_score DECIMAL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  cv_url TEXT,
  sent_via TEXT NOT NULL CHECK (sent_via IN ('manual', 'auto_email', 'platform')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'viewed', 'replied', 'rejected', 'accepted')),
  landlord_response TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_listings_platform ON listings(platform);
CREATE INDEX idx_listings_district ON listings(district);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_is_active ON listings(is_active);
CREATE INDEX idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX idx_user_matches_listing_id ON user_matches(listing_id);
CREATE INDEX idx_user_matches_notified ON user_matches(notified_at);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_listing_id ON applications(listing_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Create triggers for updated_at
CREATE TRIGGER update_listings_updated_at 
  BEFORE UPDATE ON listings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_matches_updated_at 
  BEFORE UPDATE ON user_matches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active listings
CREATE POLICY "Anyone can view active listings" ON listings
  FOR SELECT USING (is_active = true);

-- RLS Policies for user_matches
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;

-- Users can only view their own matches
CREATE POLICY "Users can view own matches" ON user_matches
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own matches (mark as viewed, dismissed, saved)
CREATE POLICY "Users can update own matches" ON user_matches
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);