-- ======================================================
-- CodeAurora Sentinel — Security Privacy & Trust Upgrade
-- Run this in Supabase → SQL Editor → New Query
-- ======================================================

-- Add AI verification metadata columns to code_reviews table
ALTER TABLE public.code_reviews
  ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'Gemini 2.5 Flash',
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0.92,
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'passed';

-- Add comment explaining the columns
COMMENT ON COLUMN public.code_reviews.ai_model IS 'The AI model name that generated the code review / fix';
COMMENT ON COLUMN public.code_reviews.confidence_score IS 'Confidence score (0.0 to 1.0) of the issue verification';
COMMENT ON COLUMN public.code_reviews.validation_status IS 'The automated verification status (e.g. passed, needs_review)';
