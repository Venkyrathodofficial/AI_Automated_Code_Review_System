/**
 * Sentinel Execution Pipeline Instrumentation & Observability Tracker
 * Instruments real execution pipeline runs with stage-by-stage latencies and error tracking.
 */

const crypto = require("crypto");
const { redactSensitiveData } = require("../security/rbac");

class ExecutionTracker {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Start a new tracked execution
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} [params.repositoryId]
   * @param {string} [params.executionType="scan"]
   * @param {string} [params.correlationId]
   * @returns {Promise<Object>} The created execution record
   */
  async startExecution({ userId, repositoryId = null, executionType = "scan", correlationId = null }) {
    const corrId = correlationId || `corr-${crypto.randomBytes(8).toString("hex")}`;
    const timestamp = Date.now();
    const executionRef = `EXEC-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;

    const executionRecord = {
      execution_ref: executionRef,
      correlation_id: corrId,
      user_id: userId,
      repository_id: repositoryId,
      execution_type: executionType,
      status: "RUNNING",
      scanner_versions: {
        custom_rules: "2.0.0",
        secrets: "2.0.0",
        semgrep: "1.0.0",
        osv_dependencies: "2.0.0"
      },
      scanner_status: {},
      findings_count: 0,
      started_at: new Date().toISOString()
    };

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from("executions")
          .insert(executionRecord)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("[ExecutionTracker] Database unavailable, falling back to in-memory trace:", err.message);
      }
    }

    return { id: `exec-${timestamp}`, ...executionRecord };
  }

  /**
   * Record a stage beginning or completion
   * @param {Object} params
   * @param {string} params.executionId
   * @param {string} params.stageName - INGESTING, SCANNING, VERIFYING, CORRELATING, SCORING, COMPLETION
   * @param {string} params.status - RUNNING, COMPLETED, FAILED, SKIPPED
   * @param {number} [params.durationMs]
   * @param {string} [params.errorDetails]
   */
  async recordStage({ executionId, stageName, status, durationMs = 0, errorDetails = null }) {
    const stageRecord = {
      execution_id: executionId,
      stage_name: stageName,
      status: status,
      duration_ms: durationMs,
      error_details: errorDetails ? redactSensitiveData(errorDetails) : null,
      completed_at: status === "COMPLETED" || status === "FAILED" ? new Date().toISOString() : null
    };

    if (this.supabase && !executionId.startsWith("exec-")) {
      try {
        await this.supabase.from("execution_stages").insert(stageRecord);
      } catch (err) {
        // Silently continue if staging table is temporarily unavailable
      }
    }

    return stageRecord;
  }

  /**
   * Complete an execution with final results
   * @param {Object} params
   * @param {string} params.executionId
   * @param {string} params.status - COMPLETED, PARTIAL, FAILED
   * @param {number} params.findingsCount
   * @param {Object} params.scannerStatus
   * @param {string} [params.errorMessage]
   */
  async completeExecution({ executionId, status, findingsCount = 0, scannerStatus = {}, errorMessage = null }) {
    const updateData = {
      status,
      findings_count: findingsCount,
      scanner_status: scannerStatus,
      error_message: errorMessage ? redactSensitiveData(errorMessage) : null,
      completed_at: new Date().toISOString()
    };

    if (this.supabase && !executionId.startsWith("exec-")) {
      try {
        await this.supabase
          .from("executions")
          .update(updateData)
          .eq("id", executionId);
      } catch (err) {
        console.warn("[ExecutionTracker] Failed to update execution completion:", err.message);
      }
    }

    return { id: executionId, ...updateData };
  }
}

module.exports = ExecutionTracker;
