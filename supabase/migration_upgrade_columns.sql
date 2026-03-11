-- Add upgrade tracking columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS upgrade_credit INT DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pending_upgrade_plan TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pending_razorpay_subscription_id TEXT;
