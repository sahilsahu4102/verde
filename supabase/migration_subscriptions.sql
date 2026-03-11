-- =============================================
-- Verde Subscription Tables Migration
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Monthly usage tracking (resets each billing period)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  dish_analyses INT DEFAULT 0,
  procurement_plans INT DEFAULT 0,
  marketing_generations INT DEFAULT 0,
  video_reels INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users read own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access subscriptions"
  ON subscriptions FOR ALL USING (true);

-- Users can read their own usage
CREATE POLICY "Users read own usage"
  ON usage_tracking FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access usage"
  ON usage_tracking FOR ALL USING (true);
