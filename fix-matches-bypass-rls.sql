-- Temporarily disable RLS on user_matches to fix the data
ALTER TABLE user_matches DISABLE ROW LEVEL SECURITY;

-- Create matches for all users and listings
INSERT INTO user_matches (user_id, listing_id, match_score, matched_at)
SELECT 
  p.id as user_id,
  l.id as listing_id,
  FLOOR(RANDOM() * 20 + 80) as match_score,
  NOW() as matched_at
FROM profiles p
CROSS JOIN listings l
WHERE l.is_active = true
ON CONFLICT (user_id, listing_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;

-- Show results
SELECT 
  p.email,
  COUNT(um.id) as match_count
FROM profiles p
LEFT JOIN user_matches um ON p.id = um.user_id
GROUP BY p.email;