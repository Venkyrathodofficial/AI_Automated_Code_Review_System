-- ============================================
-- RLS Fix for Admin Dashboard
-- Run this in Supabase → SQL Editor → New Query
-- This ensures service_role can read ALL data
-- ============================================

-- Allow service_role to read ALL code_reviews (for admin dashboard)
DROP POLICY IF EXISTS "Service role can read all reviews" ON code_reviews;
CREATE POLICY "Service role can read all reviews"
  ON code_reviews FOR SELECT
  TO service_role
  USING (true);

-- Allow service_role to read ALL user_repositories (for admin dashboard)  
DROP POLICY IF EXISTS "Service role can read all repos" ON user_repositories;
CREATE POLICY "Service role can read all repos"
  ON user_repositories FOR SELECT
  TO service_role
  USING (true);

-- Also add anon access for public stats endpoint (read-only counts)
DROP POLICY IF EXISTS "Anon can count reviews" ON code_reviews;
CREATE POLICY "Anon can count reviews"
  ON code_reviews FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can count repos" ON user_repositories;
CREATE POLICY "Anon can count repos"
  ON user_repositories FOR SELECT
  TO anon
  USING (true);

-- Verify the grants
GRANT SELECT ON code_reviews TO service_role;
GRANT SELECT ON code_reviews TO anon;
GRANT SELECT ON user_repositories TO service_role;
GRANT SELECT ON user_repositories TO anon;

-- Allow authenticated admin users to read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow authenticated admin users to read all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- Ensure correct grant permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

-- ============================================
-- After running this, verify with:
-- SELECT * FROM code_reviews LIMIT 5;
-- SELECT * FROM user_repositories LIMIT 5;
-- ============================================
