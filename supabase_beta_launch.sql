-- ============================================================
-- CodeAurora Sentinel — Beta Launch Migration
-- Run this in Supabase → SQL Editor → New Query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROMO CODES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,           -- e.g. "PROMPTWARS2026"
  plan TEXT DEFAULT 'beta',            -- 'beta' | 'admin'
  max_uses INT DEFAULT 500,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'admin',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);

-- RLS policies
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.promo_codes TO service_role;

-- Allow authenticated users to read active codes (needed for validation)
DROP POLICY IF EXISTS "Authenticated users can read active promo codes" ON public.promo_codes;
CREATE POLICY "Authenticated users can read active promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow authenticated admins to manage promo codes
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT ALL ON public.promo_codes TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 2. PROMO REDEMPTIONS (audit log)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  plan_granted TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id)  -- one redemption per user
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.promo_redemptions TO service_role;

-- Users can read their own redemption
DROP POLICY IF EXISTS "Users can view own redemption" ON public.promo_redemptions;
CREATE POLICY "Users can view own redemption"
  ON public.promo_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own redemption
DROP POLICY IF EXISTS "Users can insert own redemption" ON public.promo_redemptions;
CREATE POLICY "Users can insert own redemption"
  ON public.promo_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all promo_redemptions
DROP POLICY IF EXISTS "Admins can view all promo_redemptions" ON public.promo_redemptions;
CREATE POLICY "Admins can view all promo_redemptions"
  ON public.promo_redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.promo_redemptions TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 3. AI USAGE LOG
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scan_id TEXT,
  repository_name TEXT,
  gemini_requests INT DEFAULT 1,
  tokens_estimated INT DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON public.ai_usage_log(created_at);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ai_usage_log TO service_role;

-- Admins can view all ai_usage_log
DROP POLICY IF EXISTS "Admins can view all ai_usage_log" ON public.ai_usage_log;
CREATE POLICY "Admins can view all ai_usage_log"
  ON public.ai_usage_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.ai_usage_log TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 4. SYSTEM BUDGET STATE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_budget (
  id TEXT PRIMARY KEY DEFAULT 'global',
  monthly_cost_usd DECIMAL(10, 4) DEFAULT 0,
  daily_cost_usd DECIMAL(10, 4) DEFAULT 0,
  budget_exceeded BOOLEAN DEFAULT false,
  warning_sent BOOLEAN DEFAULT false,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_budget (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
GRANT ALL ON public.system_budget TO service_role;

-- Enable RLS on system_budget
ALTER TABLE public.system_budget ENABLE ROW LEVEL SECURITY;

-- Allow select for everyone (required for public checks)
DROP POLICY IF EXISTS "Public can read system_budget" ON public.system_budget;
CREATE POLICY "Public can read system_budget"
  ON public.system_budget FOR SELECT
  USING (true);

-- Admins can manage system_budget
DROP POLICY IF EXISTS "Admins can manage system_budget" ON public.system_budget;
CREATE POLICY "Admins can manage system_budget"
  ON public.system_budget FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.system_budget TO anon;
GRANT SELECT ON public.system_budget TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 5. SEED INITIAL PROMO CODES
-- ────────────────────────────────────────────────────────────
INSERT INTO public.promo_codes (code, plan, max_uses, expires_at, notes) VALUES
  ('PROMPTWARS2026', 'beta', 500, '2026-12-31 23:59:59+00', 'Prompt Wars Hackathon 2026 — General Access'),
  ('PW-BETA-001',    'beta', 100, '2026-12-31 23:59:59+00', 'Prompt Wars Beta Batch 1'),
  ('PW-MENTOR',      'beta', 50,  '2026-12-31 23:59:59+00', 'Prompt Wars Mentors'),
  ('PW-JUDGE',       'beta', 50,  '2026-12-31 23:59:59+00', 'Prompt Wars Judges'),
  ('CODEAURORA100',  'beta', 100, '2026-12-31 23:59:59+00', 'CodeAurora Beta Launch — Community')
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. UPDATE SUBSCRIPTIONS — support 'beta' tier
-- ────────────────────────────────────────────────────────────
-- Rename old 'basic' tier to 'beta' for consistency
UPDATE public.subscriptions SET plan_tier = 'beta' WHERE plan_tier = 'basic';

-- Update comment to reflect new tiers
COMMENT ON COLUMN public.subscriptions.plan_tier IS 'free | beta | admin';

-- ────────────────────────────────────────────────────────────
-- 7. SECURITY DEFINER RPC FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- Increment promo code used_count atomically (legacy backup)
CREATE OR REPLACE FUNCTION public.increment_promo_used_count(code_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE code = code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic, secure promo code redemption RPC
CREATE OR REPLACE FUNCTION public.redeem_promo_code(
  code_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_promo RECORD;
  v_existing RECORD;
  v_expires_at TIMESTAMPTZ;
  v_scan_limit INT;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 1. Check if user already redeemed a code
  SELECT id, code, plan_granted, expires_at INTO v_existing
  FROM public.promo_redemptions
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'You have already activated a promo code (' || v_existing.code || '). Only one code per account.',
      'code', 'ALREADY_REDEEMED'
    );
  END IF;

  -- 2. Fetch and lock the promo code
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = code_param
  FOR UPDATE; -- Prevents race conditions

  IF v_promo.code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Promo code not found. Check for typos.');
  END IF;

  IF NOT v_promo.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'This promo code has been deactivated.');
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This promo code has expired.');
  END IF;

  IF v_promo.used_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'This promo code has reached its maximum uses.');
  END IF;

  -- 3. Calculate activation expiry (90 days)
  v_expires_at := NOW() + INTERVAL '90 days';
  v_scan_limit := CASE WHEN v_promo.plan = 'admin' THEN 999999 ELSE 100 END;

  -- 4. Upgrade user subscription
  INSERT INTO public.subscriptions (user_id, plan_tier, monthly_scans_limit, status, current_period_end, updated_at)
  VALUES (v_user_id, v_promo.plan, v_scan_limit, 'active', v_expires_at, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    plan_tier = EXCLUDED.plan_tier,
    monthly_scans_limit = EXCLUDED.monthly_scans_limit,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = EXCLUDED.updated_at;

  -- 5. Log redemption
  INSERT INTO public.promo_redemptions (user_id, code, plan_granted, expires_at)
  VALUES (v_user_id, v_promo.code, v_promo.plan, v_expires_at);

  -- 6. Increment used_count
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE code = v_promo.code;

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_promo.plan,
    'scansLimit', v_scan_limit,
    'expiresAt', to_char(v_expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'message', '🎉 Access activated! You now have ' || v_scan_limit || ' scans/month.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.redeem_promo_code TO authenticated;

-- Atomic, secure AI cost logger RPC
CREATE OR REPLACE FUNCTION public.log_ai_cost(
  user_id_param UUID,
  scan_id_param TEXT,
  repo_name_param TEXT,
  tokens_param INT,
  cost_usd_param DECIMAL(10, 6),
  monthly_cap_param DECIMAL(10, 4),
  daily_cap_param DECIMAL(10, 4)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_monthly_cost DECIMAL(10, 4);
  v_daily_cost DECIMAL(10, 4);
  v_exceeded BOOLEAN;
BEGIN
  -- 1. Insert into ai_usage_log
  INSERT INTO public.ai_usage_log (user_id, scan_id, repository_name, gemini_requests, tokens_estimated, estimated_cost_usd)
  VALUES (user_id_param, scan_id_param, repo_name_param, 1, tokens_param, cost_usd_param);

  -- 2. Update system_budget
  UPDATE public.system_budget
  SET 
    monthly_cost_usd = monthly_cost_usd + cost_usd_param,
    daily_cost_usd = daily_cost_usd + cost_usd_param,
    updated_at = NOW()
  WHERE id = 'global'
  RETURNING monthly_cost_usd, daily_cost_usd INTO v_monthly_cost, v_daily_cost;

  -- 3. Check if budget exceeded
  v_exceeded := (v_monthly_cost >= monthly_cap_param) OR (v_daily_cost >= daily_cap_param);
  
  UPDATE public.system_budget
  SET budget_exceeded = v_exceeded
  WHERE id = 'global';

  RETURN v_exceeded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_ai_cost TO anon;
GRANT EXECUTE ON FUNCTION public.log_ai_cost TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 8. EXTRA ADMIN RLS POLICIES FOR WORKSPACE SYNC
-- ────────────────────────────────────────────────────────────

-- Allow authenticated users to check if they are admins
DROP POLICY IF EXISTS "Users can read their own admin status" ON public.admin_users;
CREATE POLICY "Users can read their own admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.admin_users TO authenticated;

-- Allow admins to manage admin_settings
DROP POLICY IF EXISTS "Admins can manage admin_settings" ON public.admin_settings;
CREATE POLICY "Admins can manage admin_settings"
  ON public.admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT ALL ON public.admin_settings TO authenticated;

-- Allow admins to view all user_activity_log
DROP POLICY IF EXISTS "Admins can view all user_activity_log" ON public.user_activity_log;
CREATE POLICY "Admins can view all user_activity_log"
  ON public.user_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.user_activity_log TO authenticated;
