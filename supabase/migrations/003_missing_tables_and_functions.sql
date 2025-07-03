-- AI Usage Tracking
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service TEXT CHECK (service IN ('message_generation', 'cv_generation')),
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT CHECK (plan IN ('free', 'basic', 'pro')),
  status TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Limits
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notifications_sent INTEGER DEFAULT 0,
  ai_messages_generated INTEGER DEFAULT 0,
  cvs_generated INTEGER DEFAULT 0,
  auto_applies_sent INTEGER DEFAULT 0,
  UNIQUE(user_id, period_start)
);

-- Scraper Logs
CREATE TABLE IF NOT EXISTS scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  listings_found INTEGER DEFAULT 0,
  new_listings INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('running', 'completed', 'failed'))
);

-- Add triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize user subscription as free
CREATE OR REPLACE FUNCTION create_free_subscription_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create free subscription when profile is created
CREATE TRIGGER create_free_subscription_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_free_subscription_for_user();

-- Create function to get user's current plan limits
CREATE OR REPLACE FUNCTION get_user_plan_limits(user_uuid UUID)
RETURNS TABLE(
  notifications_per_day INTEGER,
  ai_messages_per_month INTEGER,
  cv_generations_per_month INTEGER,
  auto_apply_enabled BOOLEAN
) AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT plan INTO user_plan
  FROM subscriptions
  WHERE user_id = user_uuid AND status = 'active';
  
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  CASE user_plan
    WHEN 'free' THEN
      RETURN QUERY SELECT 5, 0, 0, false;
    WHEN 'basic' THEN
      RETURN QUERY SELECT 50, 100, 5, false;
    WHEN 'pro' THEN
      RETURN QUERY SELECT -1, -1, -1, true; -- -1 means unlimited
    ELSE
      RETURN QUERY SELECT 5, 0, 0, false; -- default to free
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can perform action
CREATE OR REPLACE FUNCTION can_user_perform_action(
  user_uuid UUID,
  action_type TEXT -- 'notification', 'ai_message', 'cv_generation', 'auto_apply'
)
RETURNS BOOLEAN AS $$
DECLARE
  limits RECORD;
  current_usage RECORD;
  period_start DATE;
  period_end DATE;
BEGIN
  -- Get user's plan limits
  SELECT * INTO limits FROM get_user_plan_limits(user_uuid) LIMIT 1;
  
  -- Calculate current period (monthly for most things, daily for notifications)
  IF action_type = 'notification' THEN
    period_start := CURRENT_DATE;
    period_end := CURRENT_DATE;
  ELSE
    period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END IF;
  
  -- Get current usage
  SELECT * INTO current_usage
  FROM usage_limits
  WHERE user_id = user_uuid 
    AND period_start = period_start;
  
  -- If no usage record exists, create one
  IF current_usage IS NULL THEN
    INSERT INTO usage_limits (user_id, period_start, period_end)
    VALUES (user_uuid, period_start, period_end);
    
    SELECT * INTO current_usage
    FROM usage_limits
    WHERE user_id = user_uuid 
      AND period_start = period_start;
  END IF;
  
  -- Check limits based on action type
  CASE action_type
    WHEN 'notification' THEN
      RETURN limits.notifications_per_day = -1 OR 
             current_usage.notifications_sent < limits.notifications_per_day;
    WHEN 'ai_message' THEN
      RETURN limits.ai_messages_per_month = -1 OR 
             current_usage.ai_messages_generated < limits.ai_messages_per_month;
    WHEN 'cv_generation' THEN
      RETURN limits.cv_generations_per_month = -1 OR 
             current_usage.cvs_generated < limits.cv_generations_per_month;
    WHEN 'auto_apply' THEN
      RETURN limits.auto_apply_enabled;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid UUID,
  action_type TEXT
)
RETURNS VOID AS $$
DECLARE
  period_start DATE;
  period_end DATE;
BEGIN
  -- Calculate period
  IF action_type = 'notification' THEN
    period_start := CURRENT_DATE;
    period_end := CURRENT_DATE;
  ELSE
    period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END IF;
  
  -- Insert or update usage
  INSERT INTO usage_limits (user_id, period_start, period_end, notifications_sent, ai_messages_generated, cvs_generated, auto_applies_sent)
  VALUES (
    user_uuid, 
    period_start, 
    period_end,
    CASE WHEN action_type = 'notification' THEN 1 ELSE 0 END,
    CASE WHEN action_type = 'ai_message' THEN 1 ELSE 0 END,
    CASE WHEN action_type = 'cv_generation' THEN 1 ELSE 0 END,
    CASE WHEN action_type = 'auto_apply' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    notifications_sent = usage_limits.notifications_sent + 
      CASE WHEN action_type = 'notification' THEN 1 ELSE 0 END,
    ai_messages_generated = usage_limits.ai_messages_generated + 
      CASE WHEN action_type = 'ai_message' THEN 1 ELSE 0 END,
    cvs_generated = usage_limits.cvs_generated + 
      CASE WHEN action_type = 'cv_generation' THEN 1 ELSE 0 END,
    auto_applies_sent = usage_limits.auto_applies_sent + 
      CASE WHEN action_type = 'auto_apply' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;