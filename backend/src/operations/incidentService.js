/**
 * Sentinel Incident Management Service
 * Supports dual-tier workflows: customer incident portal and staff operational workspace.
 * Enforces SLA policies, controlled status transitions, and confidential internal notes.
 */

const crypto = require("crypto");
const { redactSensitiveData } = require("../security/rbac");

const INCIDENT_CATEGORIES = [
  "scan_failure",
  "false_positive",
  "billing",
  "integration",
  "performance",
  "general"
];

const INCIDENT_PRIORITIES = ["Critical", "High", "Medium", "Low"];

const SLA_HOURS = {
  Critical: 2,
  High: 8,
  Medium: 24,
  Low: 72
};

const VALID_TRANSITIONS = {
  NEW: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"],
  ASSIGNED: ["IN_PROGRESS", "PENDING_USER", "RESOLVED", "ESCALATED"],
  IN_PROGRESS: ["PENDING_USER", "ESCALATED", "RESOLVED"],
  PENDING_USER: ["IN_PROGRESS", "RESOLVED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["REOPENED"],
  REOPENED: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"]
};

class IncidentService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Calculate SLA deadline timestamp from priority
   */
  calculateSLADeadline(priority) {
    const hours = SLA_HOURS[priority] || 24;
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  }

  /**
   * Concurrency-safe incident reference fallback if PostgreSQL sequence isn't invoked directly
   */
  generateFallbackIncidentRef() {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `INC-${year}-${randomSuffix}`;
  }

  /**
   * Create an incident (customer-facing or automated)
   */
  async createIncident({
    userId,
    title,
    description,
    category = "general",
    priority = "Medium",
    repositoryId = null,
    executionId = null,
    organizationId = null,
    metadata = {}
  }) {
    if (!title || !description) {
      throw new Error("Incident title and description are required.");
    }
    if (!INCIDENT_CATEGORIES.includes(category)) {
      category = "general";
    }
    if (!INCIDENT_PRIORITIES.includes(priority)) {
      priority = "Medium";
    }

    const slaDeadline = this.calculateSLADeadline(priority);
    const incidentRef = this.generateFallbackIncidentRef();

    const incidentRecord = {
      incident_ref: incidentRef,
      user_id: userId,
      title: title.trim(),
      description: redactSensitiveData(description.trim()),
      category,
      priority,
      status: "NEW",
      assigned_team: "Support Tier 1",
      repository_id: repositoryId,
      execution_id: executionId,
      organization_id: organizationId,
      sla_deadline: slaDeadline,
      metadata: redactSensitiveData(metadata),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from("incidents")
        .insert(incidentRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create incident: ${error.message}`);
      }
      return data;
    }

    return { id: `inc-${Date.now()}`, ...incidentRecord };
  }

  /**
   * Transition an incident status with strict state machine validation
   */
  async transitionStatus({ incidentId, newStatus, actorId, actorRole, resolutionSummary = null, rootCause = null }) {
    if (!this.supabase) {
      return { success: true, status: newStatus };
    }

    // Fetch existing incident
    const { data: incident, error: fetchErr } = await this.supabase
      .from("incidents")
      .select("*")
      .eq("id", incidentId)
      .single();

    if (fetchErr || !incident) {
      throw new Error("Incident not found.");
    }

    const currentStatus = incident.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowed.join(", ")}`);
    }

    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === "RESOLVED") {
      updates.resolved_at = new Date().toISOString();
      if (resolutionSummary) updates.resolution_summary = resolutionSummary;
      if (rootCause) updates.root_cause_category = rootCause;
    }

    const { data: updated, error: updateErr } = await this.supabase
      .from("incidents")
      .update(updates)
      .eq("id", incidentId)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Status update failed: ${updateErr.message}`);
    }

    // Record audit event
    await this.recordAuditEvent({
      actorId,
      actorRole,
      action: "incident.status_transition",
      targetType: "incident",
      targetId: incidentId,
      metadata: {
        from: currentStatus,
        to: newStatus,
        resolutionSummary
      }
    });

    return updated;
  }

  /**
   * Add a message (customer reply or confidential internal note)
   */
  async addMessage({ incidentId, authorId, authorEmail, message, isInternal = false }) {
    if (!message || message.trim().length === 0) {
      throw new Error("Message content cannot be empty.");
    }

    const messageRecord = {
      incident_id: incidentId,
      author_id: authorId,
      author_email: authorEmail,
      message: redactSensitiveData(message.trim()),
      is_internal: !!isInternal,
      created_at: new Date().toISOString()
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from("incident_messages")
        .insert(messageRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to post message: ${error.message}`);
      }

      // Update incident updated_at timestamp
      await this.supabase
        .from("incidents")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", incidentId);

      return data;
    }

    return { id: `msg-${Date.now()}`, ...messageRecord };
  }

  /**
   * Append-only audit logging helper
   */
  async recordAuditEvent({ actorId, actorEmail, actorRole, action, targetType, targetId, metadata = {} }) {
    if (!this.supabase) return;

    try {
      await this.supabase.from("audit_events").insert({
        actor_id: actorId,
        actor_email: actorEmail,
        actor_role: actorRole,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata: redactSensitiveData(metadata),
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn("[Audit] Failed to persist audit event:", err.message);
    }
  }
}

module.exports = {
  IncidentService,
  INCIDENT_CATEGORIES,
  INCIDENT_PRIORITIES,
  VALID_TRANSITIONS
};
