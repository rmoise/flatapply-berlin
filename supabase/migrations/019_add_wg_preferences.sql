-- Add WG-specific preference columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS wg_gender_preference TEXT DEFAULT 'any' 
  CHECK (wg_gender_preference IN ('any', 'female', 'male', 'mixed')),
ADD COLUMN IF NOT EXISTS wg_min_age INTEGER DEFAULT 18 CHECK (wg_min_age >= 18),
ADD COLUMN IF NOT EXISTS wg_max_age INTEGER DEFAULT 45 CHECK (wg_max_age <= 100),
ADD COLUMN IF NOT EXISTS wg_smoking_allowed BOOLEAN,
ADD COLUMN IF NOT EXISTS wg_pets_allowed BOOLEAN;

-- Add indexes for WG preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_wg_gender ON user_preferences(wg_gender_preference);
CREATE INDEX IF NOT EXISTS idx_user_preferences_wg_age ON user_preferences(wg_min_age, wg_max_age);