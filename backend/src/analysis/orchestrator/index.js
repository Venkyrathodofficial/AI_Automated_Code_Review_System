/**
 * Analysis Orchestrator
 * Controls the flow of the multi-scanner verification engine with full execution telemetry.
 */

const { EventEmitter } = require("events");
const CustomRulesScanner = require("../scanners/customRules");
const SecretsScanner = require("../scanners/secrets");
const SemgrepScanner = require("../scanners/semgrep");
const DependencyScanner = require("../scanners/dependency");
const RepositoryContext = require("../context/repositoryContext");
const AIProvider = require("../ai/provider");
const AIVerifier = require("../ai/verifier");
const RiskCorrelationEngine = require("../risk/correlation");
const ProductionReadinessModel = require("../risk/readiness");
const ExecutionTracker = require("../../operations/executionTracker");

class AnalysisOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.state = "QUEUED"; // QUEUED, INGESTING, SCANNING, VERIFYING, CORRELATING, SCORING, COMPLETED, FAILED, PARTIAL
    this.findings = [];
    
    // Initialize default components
    this.scanners = [
      new CustomRulesScanner(),
      new SecretsScanner(),
      new SemgrepScanner(),
      new DependencyScanner()
    ];
    this.repoContextEngine = new RepositoryContext();
    this.aiProvider = new AIProvider();
    this.aiVerifier = new AIVerifier(this.aiProvider);
    this.correlationEngine = new RiskCorrelationEngine();
    this.readinessModel = new ProductionReadinessModel();
    this.tracker = options.tracker || new ExecutionTracker(options.supabase || null);
    this.errors = [];
    this.scannerStatus = {};
    this.readinessResult = null;
  }

  /**
   * Register a scanner module
   * @param {Object} scanner - Scanner instance must have a scan(files) method returning NormalizedFinding[]
   */
  registerScanner(scanner) {
    this.scanners.push(scanner);
  }

  /**
   * Run the analysis pipeline with stage instrumentation
   * @param {Array} files - List of file objects { path, content, size }
   * @param {Object} [executionMeta] - Optional execution metadata { userId, repositoryId, correlationId }
   */
  async runPipeline(files, executionMeta = {}) {
    let executionRecord = null;
    try {
      console.log("[Sentinel V2]\nScan started");
      
      // Start tracked execution record
      executionRecord = await this.tracker.startExecution({
        userId: executionMeta.userId || null,
        repositoryId: executionMeta.repositoryId || null,
        correlationId: executionMeta.correlationId || null
      });

      // Stage 1: INGESTING
      const tIngestStart = Date.now();
      this._updateState("INGESTING");
      const repoContext = this.repoContextEngine.build(files);
      await this.tracker.recordStage({
        executionId: executionRecord.id,
        stageName: "INGESTING",
        status: "COMPLETED",
        durationMs: Date.now() - tIngestStart
      });

      // Stage 2: SCANNING
      const tScanStart = Date.now();
      this._updateState("SCANNING");
      await this._executeScanners(files);
      await this.tracker.recordStage({
        executionId: executionRecord.id,
        stageName: "SCANNING",
        status: "COMPLETED",
        durationMs: Date.now() - tScanStart
      });

      // Stage 3: VERIFYING
      const tVerifyStart = Date.now();
      this._updateState("VERIFYING");
      const BATCH_SIZE = 10;
      let allVerifiedFindings = [];
      for (let i = 0; i < this.findings.length; i += BATCH_SIZE) {
        const batch = this.findings.slice(i, i + BATCH_SIZE);
        const batchContextStr = repoContext.summary;
        const verifiedBatch = await this.aiVerifier.verifyFindingsBatch(batch, { summary: batchContextStr });
        allVerifiedFindings = allVerifiedFindings.concat(verifiedBatch);
      }
      this.findings = allVerifiedFindings;
      console.log(`[Sentinel V2]\nAI Verification: completed — ${this.findings.length} findings`);
      await this.tracker.recordStage({
        executionId: executionRecord.id,
        stageName: "VERIFYING",
        status: "COMPLETED",
        durationMs: Date.now() - tVerifyStart
      });

      // Stage 4: CORRELATING
      const tCorrelateStart = Date.now();
      this._updateState("CORRELATING");
      this.findings = this.correlationEngine.correlate(this.findings);
      console.log("[Sentinel V2]\nRisk Correlation: completed");
      await this.tracker.recordStage({
        executionId: executionRecord.id,
        stageName: "CORRELATING",
        status: "COMPLETED",
        durationMs: Date.now() - tCorrelateStart
      });

      // Stage 5: SCORING
      const tScoreStart = Date.now();
      this._updateState("SCORING");
      this.readinessResult = this.readinessModel.evaluate(this.findings, { fileCount: files.length });
      console.log(`[Sentinel V2]\nReadiness: ${this.readinessResult.verdict}`);
      await this.tracker.recordStage({
        executionId: executionRecord.id,
        stageName: "SCORING",
        status: "COMPLETED",
        durationMs: Date.now() - tScoreStart
      });

      if (this.errors.length > 0 && this.findings.length >= 0) {
        this._updateState("PARTIAL");
      } else {
        this._updateState("COMPLETED");
      }

      console.log(`[Sentinel V2]\nScan finished with state: ${this.state}`);

      // Complete execution tracking
      await this.tracker.completeExecution({
        executionId: executionRecord.id,
        status: this.state,
        findingsCount: this.findings.length,
        scannerStatus: this.scannerStatus,
        errorMessage: this.errors.length > 0 ? this.errors.join("; ") : null
      });

      return {
        executionId: executionRecord.id,
        executionRef: executionRecord.execution_ref,
        correlationId: executionRecord.correlation_id,
        state: this.state,
        findings: this.findings,
        readiness: this.readinessResult,
        errors: this.errors,
        scanner_status: this.scannerStatus
      };
    } catch (err) {
      console.error("Orchestrator failed:", err);
      this._updateState("FAILED");
      this.errors.push(err.message);

      if (executionRecord) {
        await this.tracker.completeExecution({
          executionId: executionRecord.id,
          status: "FAILED",
          findingsCount: this.findings.length,
          scannerStatus: this.scannerStatus,
          errorMessage: err.message
        });
      }

      return {
        executionId: executionRecord?.id || null,
        executionRef: executionRecord?.execution_ref || null,
        correlationId: executionRecord?.correlation_id || null,
        state: this.state,
        findings: this.findings,
        errors: this.errors,
        scanner_status: this.scannerStatus
      };
    }
  }

  async _executeScanners(files) {
    this.scannerStatus = {};
    const scanPromises = this.scanners.map(async (scanner) => {
      const displayName = scanner.name || "UnknownScanner";
      let formattedName = displayName;
      if (displayName === "CustomRuleScanner") formattedName = "Custom Rules";
      else if (displayName === "SemgrepScanner") formattedName = "Semgrep";
      else if (displayName === "SecretsScanner") formattedName = "Secrets";
      else if (displayName === "OSVDependencyScanner") formattedName = "Dependencies";

      try {
        const results = await scanner.scan(files);
        const count = Array.isArray(results) ? results.length : 0;

        this.scannerStatus[displayName] = {
          status: scanner.status || "COMPLETED",
          findings: count,
          error: scanner.error || null
        };

        console.log(`[Sentinel V2]\n${formattedName}: completed — ${count} findings`);

        if (Array.isArray(results)) {
          this.findings.push(...results);
        }
      } catch (err) {
        const isUnavailable = err.message && (err.message.includes("unavailable") || err.message.includes("not installed"));
        const status = isUnavailable ? "UNAVAILABLE" : "FAILED";

        this.scannerStatus[displayName] = {
          status: status,
          findings: 0,
          error: err.message
        };

        console.warn(`[Sentinel V2]\n${formattedName}: ${status.toLowerCase()} — ${err.message}`);
        this.errors.push(`Scanner ${displayName} ${status.toLowerCase()}: ${err.message}`);
      }
    });

    await Promise.allSettled(scanPromises);
  }

  _updateState(newState) {
    this.state = newState;
    this.emit("stateChange", this.state);
  }
}

module.exports = AnalysisOrchestrator;
