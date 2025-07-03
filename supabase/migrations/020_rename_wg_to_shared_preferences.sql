-- Rename WG-specific columns to be more generic for shared living preferences
ALTER TABLE user_preferences 
RENAME COLUMN wg_gender_preference TO shared_gender_preference;

ALTER TABLE user_preferences 
RENAME COLUMN wg_min_age TO shared_min_age;

ALTER TABLE user_preferences 
RENAME COLUMN wg_max_age TO shared_max_age;

ALTER TABLE user_preferences 
RENAME COLUMN wg_smoking_allowed TO shared_smoking_allowed;

ALTER TABLE user_preferences 
RENAME COLUMN wg_pets_allowed TO shared_pets_allowed;

-- Update indexes
DROP INDEX IF EXISTS idx_user_preferences_wg_gender;
DROP INDEX IF EXISTS idx_user_preferences_wg_age;

CREATE INDEX IF NOT EXISTS idx_user_preferences_shared_gender ON user_preferences(shared_gender_preference);
CREATE INDEX IF NOT EXISTS idx_user_preferences_shared_age ON user_preferences(shared_min_age, shared_max_age);