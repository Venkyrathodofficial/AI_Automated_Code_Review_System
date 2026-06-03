-- ============================================
-- CodeAurora Sentinel v2 — Database Schema Upgrades
-- Run this in Supabase → SQL Editor → New Query
-- ============================================

-- 1. Create scan_history table to track previous repository scans
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_name TEXT NOT NULL,
  scan_date TIMESTAMPTZ DEFAULT NOW(),
  security_score INT NOT NULL DEFAULT 100,
  security_grade TEXT NOT NULL DEFAULT 'A+',
  critical_issues INT DEFAULT 0,
  high_issues INT DEFAULT 0,
  medium_issues INT DEFAULT 0,
  low_issues INT DEFAULT 0,
  files_scanned INT DEFAULT 0,
  commit_id TEXT,
  commit_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_scan_history_repo ON public.scan_history(repository_name);
CREATE INDEX IF NOT EXISTS idx_scan_history_user ON public.scan_history(user_id);

-- 2. Add columns to code_reviews to support category breakdown, line numbers, secure code, and scan grouping
ALTER TABLE public.code_reviews 
  ADD COLUMN IF NOT EXISTS scan_id UUID REFERENCES public.scan_history(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS line_number INT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general_vulnerability',
  ADD COLUMN IF NOT EXISTS secure_code TEXT,
  ADD COLUMN IF NOT EXISTS best_practices TEXT;

CREATE INDEX IF NOT EXISTS idx_code_reviews_scan ON public.code_reviews(scan_id);

-- 3. Create beta_feedback table for early-access feedback collection
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  feedback_type TEXT NOT NULL, -- 'bug' | 'feature_request' | 'satisfaction' | 'general'
  rating INT, -- Optional 1-5 rating
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies

-- Scan History policies:
-- Users can view their own scan history
DROP POLICY IF EXISTS "Users can view own scan history" ON public.scan_history;
CREATE POLICY "Users can view own scan history"
  ON public.scan_history FOR SELECT
  USING (auth.uid() = user_id);

-- PUBLIC SELECT: anyone can view a scan history row by its UUID (for shareable links)
DROP POLICY IF EXISTS "Public can view scan history by ID" ON public.scan_history;
CREATE POLICY "Public can view scan history by ID"
  ON public.scan_history FOR SELECT
  TO public
  USING (true);

-- Anyone can insert scan history (specifically for background webhook scans using anon key)
DROP POLICY IF EXISTS "Public can insert scan history" ON public.scan_history;
CREATE POLICY "Public can insert scan history"
  ON public.scan_history FOR INSERT
  WITH CHECK (true);

-- Code Reviews public read extension:
-- Allow anyone to view code reviews associated with a scan_id (for shareable links)
DROP POLICY IF EXISTS "Public can view code reviews by scan_id" ON public.code_reviews;
CREATE POLICY "Public can view code reviews by scan_id"
  ON public.code_reviews FOR SELECT
  TO public
  USING (scan_id IS NOT NULL);

-- Beta Feedback policies:
-- Anyone can insert feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.beta_feedback;
CREATE POLICY "Anyone can insert feedback"
  ON public.beta_feedback FOR INSERT
  WITH CHECK (true);

-- Only service role and admins can view feedback
DROP POLICY IF EXISTS "Admins can view feedback" ON public.beta_feedback;
CREATE POLICY "Admins can view feedback"
  ON public.beta_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- Grants
GRANT ALL ON public.scan_history TO service_role;
GRANT SELECT ON public.scan_history TO authenticated;
GRANT SELECT ON public.scan_history TO anon;

GRANT ALL ON public.beta_feedback TO service_role;
GRANT INSERT ON public.beta_feedback TO authenticated;
GRANT INSERT ON public.beta_feedback TO anon;
GRANT SELECT ON public.beta_feedback TO authenticated;
