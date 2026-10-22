-- ==============================================================================
-- CodeAurora Sentinel AI — Admin Operations, Pipeline & Incident Management
-- Supabase PostgreSQL Migration
-- ==============================================================================

-- 1. Create atomic sequence for human-readable, concurrency-safe Incident References
CREATE SEQUENCE IF NOT EXISTS incident_reference_seq START WITH 1001;

-- Function to generate next incident reference: INC-YYYY-XXXXXX
CREATE OR REPLACE FUNCTION generate_incident_ref()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_val BIGINT;
BEGIN
  current_year := to_char(CURRENT_TIMESTAMP, 'YYYY');
  next_val := nextval('incident_reference_seq');
  RETURN 'INC-' || current_year || '-' || lpad(next_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 2. Executions Table (Real Pipeline Runs)
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_ref TEXT UNIQUE NOT NULL,
  correlation_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  execution_type TEXT NOT NULL DEFAULT 'scan', -- scan, pull_request, manual
  status TEXT NOT NULL DEFAULT 'QUEUED',       -- QUEUED, RUNNING, COMPLETED, PARTIAL, FAILED, CANCELLED
  scanner_versions JSONB DEFAULT '{}'::jsonb,
  scanner_status JSONB DEFAULT '{}'::jsonb,
  findings_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_created ON executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_user ON executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_repo ON executions(repository_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_correlation ON executions(correlation_id);

-- 3. Execution Stages (Stage-by-stage pipeline observability)
CREATE TABLE IF NOT EXISTS execution_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,                   -- INGESTING, SCANNING, VERIFYING, CORRELATING, SCORING, COMPLETION
  status TEXT NOT NULL DEFAULT 'RUNNING',      -- PENDING, RUNNING, COMPLETED, FAILED, SKIPPED
  duration_ms INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  error_details TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_execution_stages_exec ON execution_stages(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_stages_name ON execution_stages(stage_name);

-- 4. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_ref TEXT UNIQUE NOT NULL DEFAULT generate_incident_ref(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  repository_id UUID REFERENCES repositories(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES executions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,                      -- scan_failure, false_positive, billing, integration, performance, general
  priority TEXT NOT NULL DEFAULT 'Medium',     -- Critical, High, Medium, Low
  status TEXT NOT NULL DEFAULT 'NEW',          -- NEW, ASSIGNED, IN_PROGRESS, PENDING_USER, ESCALATED, RESOLVED, REOPENED
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_team TEXT DEFAULT 'Support Tier 1',
  sla_deadline TIMESTAMPTZ,
  resolution_summary TEXT,
  root_cause_category TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_user ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON incidents(assigned_to);

-- 5. Incident Messages (Public replies vs Confidential Internal Staff Notes)
CREATE TABLE IF NOT EXISTS incident_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_email TEXT,
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,  -- STRICT: TRUE = Staff only, FALSE = Visible to customer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_messages_incident ON incident_messages(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_messages_created ON incident_messages(created_at ASC);

-- 6. Append-Only Audit Trail
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,                        -- incident.create, incident.status_transition, execution.retry, etc.
  target_type TEXT NOT NULL,                   -- incident, execution, settings, user
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_events(target_type, target_id);

-- 7. Operational Alert Rules & Events
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,                    -- scan_failure, high_latency, scanner_unavailable, error_spike
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  threshold_value INTEGER DEFAULT 1,
  cooldown_minutes INTEGER DEFAULT 15,
  notification_channel TEXT DEFAULT 'in_app',  -- in_app, email, slack
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  correlation_fingerprint TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, DELIVERED, FAILED
  payload JSONB DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_events_fingerprint ON alert_events(correlation_fingerprint);
CREATE INDEX IF NOT EXISTS idx_alert_events_triggered ON alert_events(triggered_at DESC);

-- 8. Row-Level Security (RLS) Configuration
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin/staff
CREATE OR REPLACE FUNCTION is_platform_staff(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Executions
CREATE POLICY "Users can view their own executions"
  ON executions FOR SELECT
  USING (user_id = auth.uid() OR is_platform_staff(auth.uid()));

CREATE POLICY "Users can create executions"
  ON executions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_platform_staff(auth.uid()));

CREATE POLICY "Staff can update executions"
  ON executions FOR UPDATE
  USING (is_platform_staff(auth.uid()));

-- Policies for Execution Stages
CREATE POLICY "Users can view stages of visible executions"
  ON execution_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM executions e
      WHERE e.id = execution_stages.execution_id
      AND (e.user_id = auth.uid() OR is_platform_staff(auth.uid()))
    )
  );

-- Policies for Incidents
CREATE POLICY "Users can view their own incidents"
  ON incidents FOR SELECT
  USING (user_id = auth.uid() OR is_platform_staff(auth.uid()));

CREATE POLICY "Users can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff and owners can update incidents"
  ON incidents FOR UPDATE
  USING (user_id = auth.uid() OR is_platform_staff(auth.uid()));

-- CRITICAL: Incident Messages Privacy Barrier
-- Regular customers CAN NEVER select messages where is_internal is true!
CREATE POLICY "Customers view public messages; Staff view all"
  ON incident_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incidents i
      WHERE i.id = incident_messages.incident_id
      AND (
        (i.user_id = auth.uid() AND incident_messages.is_internal = FALSE)
        OR is_platform_staff(auth.uid())
      )
    )
  );

CREATE POLICY "Users and staff can post messages to accessible incidents"
  ON incident_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM incidents i
      WHERE i.id = incident_messages.incident_id
      AND (i.user_id = auth.uid() OR is_platform_staff(auth.uid()))
    )
  );

-- Audit Events: Staff view only, Append-only
CREATE POLICY "Staff can view audit trail"
  ON audit_events FOR SELECT
  USING (is_platform_staff(auth.uid()));

CREATE POLICY "System can append audit trail"
  ON audit_events FOR INSERT
  WITH CHECK (true);

-- Service role bypass for backend orchestrator
GRANT ALL ON executions TO service_role;
GRANT ALL ON execution_stages TO service_role;
GRANT ALL ON incidents TO service_role;
GRANT ALL ON incident_messages TO service_role;
GRANT ALL ON audit_events TO service_role;
GRANT ALL ON alert_rules TO service_role;
GRANT ALL ON alert_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE incident_reference_seq TO service_role;
