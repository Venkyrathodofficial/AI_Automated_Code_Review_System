-- ============================================
-- AI Code Review — SaaS Subscription Migration
-- Run this in Supabase → SQL Editor → New Query
-- ============================================

-- 0. Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant service_role full access
GRANT ALL ON public.profiles TO service_role;

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_tier TEXT DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  status TEXT DEFAULT 'active', -- 'active' | 'past_due' | 'canceled' | 'unpaid'
  current_period_end TIMESTAMPTZ,
  monthly_scans_used INT DEFAULT 0,
  monthly_scans_limit INT DEFAULT 3, -- Free limit is 3 scans/month
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- 2. Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only backend service role can insert, update, or delete subscriptions
DROP POLICY IF EXISTS "Service role can modify subscriptions" ON public.subscriptions;

-- 4. Grant service_role full access
GRANT ALL ON public.subscriptions TO service_role;

-- 5. Auto-create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_tier, monthly_scans_limit)
  VALUES (new.id, 'free', 5)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- 6. Backfill existing users with free subscriptions
INSERT INTO public.subscriptions (user_id, plan_tier, monthly_scans_limit)
SELECT id, 'free', 5 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 7. Safe scan increment RPC function
CREATE OR REPLACE FUNCTION public.increment_monthly_scans(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET monthly_scans_used = monthly_scans_used + 1
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
