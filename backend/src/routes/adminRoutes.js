/**
 * Sentinel Admin & Operations Console Routes
 * Staff-facing endpoints for platform telemetry, pipeline monitoring, incident triage, and audit trail.
 * Strictly enforces Role-Based Access Control (RBAC) and data redaction.
 */

const express = require("express");
const { ROLES, requireRoles, redactSensitiveData } = require("../security/rbac");
const { globalScannerRegistry } = require("../analysis/scanners/registry");
const { IncidentService, INCIDENT_CATEGORIES, INCIDENT_PRIORITIES } = require("../operations/incidentService");

function createAdminRouter(supabase) {
  const router = express.Router();
  const incidentService = new IncidentService(supabase);

  // Apply base staff authorization across all admin routes
  router.use(requireRoles([
    ROLES.PLATFORM_OWNER,
    ROLES.PLATFORM_ADMIN,
    ROLES.OPERATIONS_ENGINEER,
    ROLES.SUPPORT_AGENT,
    "admin" // legacy backwards-compatibility
  ]));

  // =========================================================================
  // 1. Operations Overview Metrics
  // =========================================================================
  router.get("/metrics", async (req, res) => {
    try {
      // 1. Engine availability check
      const scannerHealth = await globalScannerRegistry.checkAllAvailability();

      // 2. Query execution statistics
      const { data: executions, error: execErr } = await req.supabase
        .from("executions")
        .select("status, started_at, completed_at, error_message")
        .order("created_at", { ascending: false })
        .limit(100);

      const execStats = {
        total: executions?.length || 0,
        running: executions?.filter(e => e.status === "RUNNING").length || 0,
        completed: executions?.filter(e => e.status === "COMPLETED").length || 0,
        partial: executions?.filter(e => e.status === "PARTIAL").length || 0,
        failed: executions?.filter(e => e.status === "FAILED").length || 0
      };

      // 3. Query incident queues & SLA breaches
      const { data: incidents, error: incErr } = await req.supabase
        .from("incidents")
        .select("id, priority, status, sla_deadline, assigned_to");

      const now = new Date();
      let overdueSLACount = 0;
      let unassignedCount = 0;
      const incidentsByPriority = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      const incidentsByStatus = { NEW: 0, ASSIGNED: 0, IN_PROGRESS: 0, PENDING_USER: 0, ESCALATED: 0, RESOLVED: 0, REOPENED: 0 };

      if (incidents) {
        for (const inc of incidents) {
          if (inc.status !== "RESOLVED") {
            if (inc.sla_deadline && new Date(inc.sla_deadline) < now) {
              overdueSLACount++;
            }
            if (!inc.assigned_to) {
              unassignedCount++;
            }
          }
          if (incidentsByPriority[inc.priority] !== undefined) {
            incidentsByPriority[inc.priority]++;
          }
          if (incidentsByStatus[inc.status] !== undefined) {
            incidentsByStatus[inc.status]++;
          }
        }
      }

      return res.json({
        timestamp: new Date().toISOString(),
        executions: execStats,
        scanners: scannerHealth,
        incidents: {
          total: incidents?.length || 0,
          unassigned: unassignedCount,
          overdueSLA: overdueSLACount,
          byPriority: incidentsByPriority,
          byStatus: incidentsByStatus
        }
      });
    } catch (err) {
      console.error("[Admin Metrics Error]", err);
      return res.status(500).json({ error: "Failed to compile operational metrics" });
    }
  });

  // =========================================================================
  // 2. Dynamic Scanner Registry Status
  // =========================================================================
  router.get("/scanners", async (_req, res) => {
    try {
      const engines = await globalScannerRegistry.checkAllAvailability();
      const metadata = globalScannerRegistry.getAllEngines();
      return res.json({
        engines,
        metadata
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to check scanner availability" });
    }
  });

  // =========================================================================
  // 3. Pipeline & Execution Monitor
  // =========================================================================
  router.get("/executions", async (req, res) => {
    try {
      const { status, type, limit = 50, offset = 0 } = req.query;

      let query = req.supabase
        .from("executions")
        .select("id, execution_ref, correlation_id, execution_type, status, findings_count, error_message, started_at, completed_at, created_at, user_id, repository_id")
        .order("created_at", { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (status) query = query.eq("status", status);
      if (type) query = query.eq("execution_type", type);

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        executions: redactSensitiveData(data || []),
        count: count || data?.length || 0
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to list executions" });
    }
  });

  router.get("/executions/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { data: execution, error: execErr } = await req.supabase
        .from("executions")
        .select("*")
        .eq("id", id)
        .single();

      if (execErr || !execution) {
        return res.status(404).json({ error: "Execution not found" });
      }

      // Fetch stages
      const { data: stages } = await req.supabase
        .from("execution_stages")
        .select("*")
        .eq("execution_id", id)
        .order("started_at", { ascending: true });

      return res.json({
        execution: redactSensitiveData(execution),
        stages: stages || []
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to retrieve execution details" });
    }
  });

  router.post("/executions/:id/retry", requireRoles([ROLES.PLATFORM_OWNER, ROLES.PLATFORM_ADMIN, ROLES.OPERATIONS_ENGINEER, "admin"]), async (req, res) => {
    try {
      const { id } = req.params;

      const { data: execution, error: execErr } = await req.supabase
        .from("executions")
        .select("*")
        .eq("id", id)
        .single();

      if (execErr || !execution) {
        return res.status(404).json({ error: "Execution not found" });
      }

      if (execution.status !== "FAILED" && execution.status !== "CANCELLED") {
        return res.status(400).json({ error: `Cannot retry execution in status "${execution.status}". Only FAILED or CANCELLED executions can be retried.` });
      }

      // Log retry audit event
      await incidentService.recordAuditEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.userRole || "operations_engineer",
        action: "execution.retry",
        targetType: "execution",
        targetId: id,
        metadata: { originalRef: execution.execution_ref }
      });

      // Mark execution as QUEUED for reprocessing
      const { data: updated, error: updateErr } = await req.supabase
        .from("executions")
        .update({
          status: "QUEUED",
          error_message: null,
          started_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) return res.status(500).json({ error: updateErr.message });

      return res.json({
        success: true,
        message: "Execution queued for safe re-run",
        execution: updated
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to retry execution" });
    }
  });

  // =========================================================================
  // 4. Staff Incident Management Queue
  // =========================================================================
  router.get("/incidents", async (req, res) => {
    try {
      const { status, priority, category, unassigned } = req.query;

      let query = req.supabase
        .from("incidents")
        .select("id, incident_ref, title, category, priority, status, assigned_to, assigned_team, sla_deadline, created_at, updated_at, resolved_at, user_id, execution_id")
        .order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (priority) query = query.eq("priority", priority);
      if (category) query = query.eq("category", category);
      if (unassigned === "true") query = query.is("assigned_to", null);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        incidents: redactSensitiveData(data || []),
        categories: INCIDENT_CATEGORIES,
        priorities: INCIDENT_PRIORITIES
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to list staff incidents" });
    }
  });

  router.get("/incidents/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { data: incident, error: incErr } = await req.supabase
        .from("incidents")
        .select("*")
        .eq("id", id)
        .single();

      if (incErr || !incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      // Staff view: includes ALL messages (both customer replies and confidential internal notes)
      const { data: messages } = await req.supabase
        .from("incident_messages")
        .select("*")
        .eq("incident_id", id)
        .order("created_at", { ascending: true });

      return res.json({
        incident: redactSensitiveData(incident),
        messages: messages || []
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to retrieve incident" });
    }
  });

  router.patch("/incidents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, priority, assigned_to, resolution_summary, root_cause_category } = req.body;

      let updated = null;

      // Handle status transition if status changed
      if (status) {
        updated = await incidentService.transitionStatus({
          incidentId: id,
          newStatus: status,
          actorId: req.user.id,
          actorRole: req.userRole || "support_agent",
          resolutionSummary: resolution_summary,
          rootCause: root_cause_category
        });
      }

      // Handle assignment or priority changes
      const patchUpdates = {};
      if (priority && INCIDENT_PRIORITIES.includes(priority)) patchUpdates.priority = priority;
      if (assigned_to !== undefined) patchUpdates.assigned_to = assigned_to;

      if (Object.keys(patchUpdates).length > 0) {
        patchUpdates.updated_at = new Date().toISOString();
        const { data, error } = await req.supabase
          .from("incidents")
          .update(patchUpdates)
          .eq("id", id)
          .select()
          .single();

        if (error) return res.status(500).json({ error: error.message });
        updated = data;

        await incidentService.recordAuditEvent({
          actorId: req.user.id,
          actorEmail: req.user.email,
          actorRole: req.userRole || "support_agent",
          action: "incident.update",
          targetType: "incident",
          targetId: id,
          metadata: patchUpdates
        });
      }

      return res.json({
        success: true,
        incident: redactSensitiveData(updated)
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to update incident" });
    }
  });

  // Post staff reply or confidential internal note
  router.post("/incidents/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const { message, is_internal = false } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message content cannot be empty" });
      }

      const postedMessage = await incidentService.addMessage({
        incidentId: id,
        authorId: req.user.id,
        authorEmail: req.user.email || "support@codeaurorasentinel.com",
        message,
        isInternal: !!is_internal
      });

      // Audit internal note creation
      if (is_internal) {
        await incidentService.recordAuditEvent({
          actorId: req.user.id,
          actorEmail: req.user.email,
          actorRole: req.userRole || "support_agent",
          action: "incident.internal_note_added",
          targetType: "incident",
          targetId: id
        });
      }

      return res.status(201).json({
        success: true,
        message: postedMessage
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to post message" });
    }
  });

  // =========================================================================
  // 5. Customer & Organization Directory
  // =========================================================================
  router.get("/organizations", async (req, res) => {
    try {
      // Query profiles/users with project counts
      const { data: users, error: userErr } = await req.supabase
        .from("profiles")
        .select("id, updated_at")
        .limit(100);

      const { data: repos } = await req.supabase
        .from("repositories")
        .select("id, user_id, name, full_name, is_private, created_at");

      const orgList = (users || []).map(u => {
        const userRepos = (repos || []).filter(r => r.user_id === u.id);
        return {
          id: u.id,
          name: `Org-${u.id.slice(0, 8)}`,
          projectCount: userRepos.length,
          lastActive: u.updated_at,
          status: "ACTIVE"
        };
      });

      return res.json({
        organizations: orgList
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to list customer accounts" });
    }
  });

  // =========================================================================
  // 6. Audit Trail
  // =========================================================================
  router.get("/audit-events", requireRoles([ROLES.PLATFORM_OWNER, ROLES.PLATFORM_ADMIN, "admin"]), async (req, res) => {
    try {
      const { limit = 100, action, targetType } = req.query;

      let query = req.supabase
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(Number(limit));

      if (action) query = query.eq("action", action);
      if (targetType) query = query.eq("target_type", targetType);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        events: redactSensitiveData(data || [])
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to query audit trail" });
    }
  });

  // =========================================================================
  // 7. Alert Rules & Notifications
  // =========================================================================
  router.get("/alerts", async (req, res) => {
    try {
      const { data: rules, error } = await req.supabase
        .from("alert_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        rules: rules || []
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to list alert rules" });
    }
  });

  router.post("/alerts", requireRoles([ROLES.PLATFORM_OWNER, ROLES.PLATFORM_ADMIN, "admin"]), async (req, res) => {
    try {
      const { name, event_type, condition, threshold_value, cooldown_minutes, notification_channel } = req.body;

      if (!name || !event_type) {
        return res.status(400).json({ error: "Name and event_type are required" });
      }

      const { data, error } = await req.supabase
        .from("alert_rules")
        .insert({
          name,
          event_type,
          condition: condition || {},
          threshold_value: threshold_value || 1,
          cooldown_minutes: cooldown_minutes || 15,
          notification_channel: notification_channel || "in_app"
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({
        success: true,
        rule: data
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to create alert rule" });
    }
  });

  return router;
}

module.exports = createAdminRouter;
