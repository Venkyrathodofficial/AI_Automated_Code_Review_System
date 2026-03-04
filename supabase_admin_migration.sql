-- ============================================
-- Admin Dashboard — Supabase Migration
-- Run this in Supabase → SQL Editor → New Query
-- ============================================

-- 1. Admin settings table (maintenance mode, notices, etc.)
CREATE TABLE IF NOT EXISTS admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT DEFAULT 'We are currently performing scheduled maintenance. Please check back shortly.',
  notice_enabled BOOLEAN DEFAULT FALSE,
  notice_message TEXT DEFAULT '',
  notice_type TEXT DEFAULT 'info',  -- info, warning, critical
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default row
INSERT INTO admin_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- 2. Admin users table  (who can access admin panel)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User activity log (track signups, logins, etc.)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  event_type TEXT NOT NULL,  -- signup, login, logout
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_event ON user_activity_log(event_type);

-- 4. Disable RLS on admin tables (backend uses service_role key)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, but add policies for completeness
CREATE POLICY "Service role full access on admin_settings"
  ON admin_settings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on admin_users"
  ON admin_users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_activity_log"
  ON user_activity_log FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON admin_settings TO service_role;
GRANT ALL ON admin_users TO service_role;
GRANT ALL ON user_activity_log TO service_role;

-- 5. Allow public read of admin_settings for maintenance/notice checks
--    (anon key can read maintenance status without auth)
CREATE POLICY "Public can read admin_settings"
  ON admin_settings FOR SELECT USING (true);

GRANT SELECT ON admin_settings TO anon;

-- ============================================
-- IMPORTANT: After running this migration,
-- insert your admin user:
--
-- INSERT INTO admin_users (user_id)
-- SELECT id FROM auth.users WHERE email = 'your-admin@example.com';
-- ============================================
