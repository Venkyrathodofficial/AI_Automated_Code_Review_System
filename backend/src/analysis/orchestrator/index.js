/**
 * Analysis Orchestrator
 * Controls the flow of the multi-scanner verification engine.
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

class AnalysisOrchestrator extends EventEmitter {
  constructor() {
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
    this.errors = [];
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
   * Run the analysis pipeline
   * @param {Array} files - List of file objects { path, content, size }
   */
  async runPipeline(files) {
    try {
      console.log("[Sentinel V2]\nScan started");
      this._updateState("INGESTING");
      const repoContext = this.repoContextEngine.build(files);

      this._updateState("SCANNING");
      await this._executeScanners(files);

      this._updateState("VERIFYING");
      // Process findings in batches of 10 to respect API rate limits
      const BATCH_SIZE = 10;
      let allVerifiedFindings = [];
      for (let i = 0; i < this.findings.length; i += BATCH_SIZE) {
        const batch = this.findings.slice(i, i + BATCH_SIZE);
        const batchContextStr = this.repoContextEngine.build(files).summary;
        const verifiedBatch = await this.aiVerifier.verifyFindingsBatch(batch, { summary: batchContextStr });
        allVerifiedFindings = allVerifiedFindings.concat(verifiedBatch);
      }
      this.findings = allVerifiedFindings;
      console.log(`[Sentinel V2]\nAI Verification: completed — ${this.findings.length} findings`);

      this._updateState("CORRELATING");
      this.findings = this.correlationEngine.correlate(this.findings);
      console.log("[Sentinel V2]\nRisk Correlation: completed");

      this._updateState("SCORING");
      this.readinessResult = this.readinessModel.evaluate(this.findings, { fileCount: files.length });
      console.log(`[Sentinel V2]\nReadiness: ${this.readinessResult.verdict}`);

      if (this.errors.length > 0 && this.findings.length >= 0) {
        this._updateState("PARTIAL");
      } else {
        this._updateState("COMPLETED");
      }

      console.log("[Sentinel V2]\nScan completed");

      return {
        state: this.state,
        findings: this.findings,
        readiness: this.readinessResult,
        errors: this.errors
      };
    } catch (err) {
      console.error("Orchestrator failed:", err);
      this._updateState("FAILED");
      this.errors.push(err.message);
      return {
        state: this.state,
        findings: this.findings,
        errors: this.errors
      };
    }
  }

  async _executeScanners(files) {
    const scanPromises = this.scanners.map(async (scanner) => {
      try {
        const results = await scanner.scan(files);
        const count = Array.isArray(results) ? results.length : 0;
        let displayName = scanner.name;
        if (scanner.name === "CustomRuleScanner") displayName = "Custom Rules";
        else if (scanner.name === "SemgrepScanner") displayName = "Semgrep";
        else if (scanner.name === "SecretsScanner") displayName = "Secrets";
        else if (scanner.name === "OSVDependencyScanner") displayName = "Dependencies";

        console.log(`[Sentinel V2]\n${displayName}: completed — ${count} findings`);

        if (Array.isArray(results)) {
          this.findings.push(...results);
        }
      } catch (err) {
        console.error(`Scanner ${scanner.name || "Unknown"} failed:`, err.message);
        this.errors.push(`Scanner ${scanner.name || "Unknown"} failed: ${err.message}`);
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
