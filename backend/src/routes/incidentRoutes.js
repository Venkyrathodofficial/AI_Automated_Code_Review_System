/**
 * Sentinel Customer Incident Routes
 * User-facing incident creation, ticket tracking, and communication with support.
 * Strict customer data isolation: users only see their own organization's tickets and public messages.
 */

const express = require("express");
const { IncidentService, INCIDENT_CATEGORIES, INCIDENT_PRIORITIES } = require("../operations/incidentService");
const { redactSensitiveData } = require("../security/rbac");

function createIncidentRouter(supabase) {
  const router = express.Router();
  const incidentService = new IncidentService(supabase);

  // 1. Create a new incident (Customer-facing)
  router.post("/", async (req, res) => {
    try {
      const { title, description, category, priority, repositoryId, executionId } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required." });
      }

      const incident = await incidentService.createIncident({
        userId: req.user.id,
        title,
        description,
        category: category || "general",
        priority: priority || "Medium",
        repositoryId: repositoryId || null,
        executionId: executionId || null
      });

      return res.status(201).json({
        success: true,
        incident: redactSensitiveData(incident)
      });
    } catch (err) {
      console.error("[Incident Create Error]", err);
      return res.status(500).json({ error: err.message || "Failed to create incident" });
    }
  });

  // 2. List customer incidents (strictly isolated to current user)
  router.get("/", async (req, res) => {
    try {
      const { status, category } = req.query;

      let query = req.supabase
        .from("incidents")
        .select("id, incident_ref, title, category, priority, status, sla_deadline, created_at, updated_at, resolved_at")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (category) query = query.eq("category", category);

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({
        incidents: data || [],
        categories: INCIDENT_CATEGORIES,
        priorities: INCIDENT_PRIORITIES
      });
    } catch (err) {
      console.error("[Incident List Error]", err);
      return res.status(500).json({ error: "Failed to list incidents" });
    }
  });

  // 3. Get incident details & public conversation (Customer view: NEVER includes is_internal = true)
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Ensure customer owns the incident
      const { data: incident, error: incError } = await req.supabase
        .from("incidents")
        .select("*")
        .eq("id", id)
        .eq("user_id", req.user.id)
        .single();

      if (incError || !incident) {
        return res.status(404).json({ error: "Incident not found or unauthorized access" });
      }

      // Fetch ONLY public messages (is_internal = false)
      const { data: messages, error: msgError } = await req.supabase
        .from("incident_messages")
        .select("id, author_id, author_email, message, created_at")
        .eq("incident_id", id)
        .eq("is_internal", false)
        .order("created_at", { ascending: true });

      if (msgError) {
        return res.status(500).json({ error: msgError.message });
      }

      return res.json({
        incident: redactSensitiveData(incident),
        messages: messages || []
      });
    } catch (err) {
      console.error("[Incident Detail Error]", err);
      return res.status(500).json({ error: "Failed to retrieve incident" });
    }
  });

  // 4. Customer replies to an existing incident
  router.post("/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message cannot be empty." });
      }

      // Verify incident ownership
      const { data: incident, error: incError } = await req.supabase
        .from("incidents")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", req.user.id)
        .single();

      if (incError || !incident) {
        return res.status(404).json({ error: "Incident not found or unauthorized access" });
      }

      // Customer messages are ALWAYS public (isInternal = false)
      const postedMessage = await incidentService.addMessage({
        incidentId: id,
        authorId: req.user.id,
        authorEmail: req.user.email || "customer@example.com",
        message,
        isInternal: false
      });

      // If customer replies to a resolved incident, automatically transition to REOPENED
      if (incident.status === "RESOLVED") {
        await incidentService.transitionStatus({
          incidentId: id,
          newStatus: "REOPENED",
          actorId: req.user.id,
          actorRole: "customer_member"
        });
      }

      return res.status(201).json({
        success: true,
        message: postedMessage
      });
    } catch (err) {
      console.error("[Incident Reply Error]", err);
      return res.status(500).json({ error: err.message || "Failed to post message" });
    }
  });

  return router;
}

module.exports = createIncidentRouter;
