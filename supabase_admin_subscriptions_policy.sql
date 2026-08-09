-- ======================================================
-- CodeAurora Sentinel — Admin Subscriptions RLS Upgrade
-- Run this in Supabase → SQL Editor → New Query
-- ======================================================

-- 1. Allow admins to view all subscription records
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- 2. Allow admins to update subscription records
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
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

-- 3. Upgrade all legacy free subscriptions to 5 scans limit
UPDATE public.subscriptions
  SET monthly_scans_limit = 5
  WHERE plan_tier = 'free' AND monthly_scans_limit = 3;
