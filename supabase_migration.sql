-- ============================================
-- AI Code Review — Supabase Migration
-- Run this in Supabase → SQL Editor → New Query
-- ============================================

-- 1. Create user_repositories table
CREATE TABLE IF NOT EXISTS user_repositories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,
  webhook_secret TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, repo_full_name)
);

-- 2. Add user_id column to existing code_reviews table
--    (nullable so existing rows aren't broken)
ALTER TABLE code_reviews
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_repos_user ON user_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_code_reviews_user ON code_reviews(user_id);

-- 4. Enable RLS on user_repositories
ALTER TABLE user_repositories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own repos" ON user_repositories;
CREATE POLICY "Users can view own repos"
  ON user_repositories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own repos" ON user_repositories;
CREATE POLICY "Users can insert own repos"
  ON user_repositories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own repos" ON user_repositories;
CREATE POLICY "Users can delete own repos"
  ON user_repositories FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Enable RLS on code_reviews
ALTER TABLE code_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reviews" ON code_reviews;
CREATE POLICY "Users can view own reviews"
  ON code_reviews FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert reviews" ON code_reviews;
CREATE POLICY "Service can insert reviews"
  ON code_reviews FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own reviews" ON code_reviews;
CREATE POLICY "Users can update own reviews"
  ON code_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Grant service_role full access (for backend operations)
GRANT ALL ON user_repositories TO service_role;
GRANT ALL ON code_reviews TO service_role;
