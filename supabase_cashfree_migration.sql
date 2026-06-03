-- ============================================
-- Cashfree Payment Migration
-- Run this in Supabase → SQL Editor → New Query
-- ============================================

-- Add Cashfree-specific columns to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT,
  ADD COLUMN IF NOT EXISTS cashfree_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'cashfree';

-- Add index for fast order lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_cashfree_order
  ON public.subscriptions(cashfree_order_id);

-- Update default scan limit for free tier to 5
-- (was 3 in original schema, should be 5 per new pricing)
UPDATE public.subscriptions
  SET monthly_scans_limit = 5
  WHERE plan_tier = 'free' AND monthly_scans_limit = 3;

-- Update the auto-create trigger to use correct free limit
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_tier, monthly_scans_limit)
  VALUES (new.id, 'free', 5)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: stripe_customer_id and stripe_subscription_id columns are kept
-- for historical reference but will no longer be populated.
-- New payments will use cashfree_order_id and cashfree_payment_id.

COMMENT ON COLUMN public.subscriptions.plan_tier IS 'free | basic | startup | enterprise';
COMMENT ON COLUMN public.subscriptions.payment_provider IS 'cashfree (default) | stripe (legacy)';
