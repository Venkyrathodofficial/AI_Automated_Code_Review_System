/**
 * NormalizedFinding Class
 * Standardizes the output schema for all scanners (Semgrep, Custom Rules, Secrets, Dependency).
 */
class NormalizedFinding {
  /**
   * @param {Object} opts
   * @param {string} opts.id - Unique ID or hash for the finding (optional)
   * @param {string} opts.scanner - Name of the scanner (e.g. "Semgrep", "CustomRule", "OSV")
   * @param {string} opts.file - File path
   * @param {number|null} opts.line - Line number
   * @param {number|null} opts.column - Column number
   * @param {string} opts.severity - "Critical", "High", "Medium", "Low", "Info"
   * @param {string} opts.title - Short, descriptive title
   * @param {string} opts.description - Detailed explanation
   * @param {string} opts.evidence - Code snippet or contextual evidence
   * @param {string} opts.category - e.g. "sql_injection", "xss", "api_key_exposure", "dependency_vulnerability"
   * @param {string|null} opts.cwe - CWE ID (if applicable)
   * @param {string|null} opts.owasp - OWASP Top 10 category (if applicable)
   * @param {number} opts.confidence - Initial confidence score (0.0 to 1.0)
   * @param {string} opts.secure_fix - AI/scanner proposed secure code snippet
   */
  constructor(opts) {
    this.id = opts.id || `find-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.scanner = opts.scanner || "Unknown";
    this.file = opts.file || "Unknown";
    this.line = opts.line || null;
    this.column = opts.column || null;
    this.severity = opts.severity || "Low";
    this.title = opts.title || "Potential Vulnerability";
    this.description = opts.description || "";
    this.evidence = opts.evidence || "";
    this.category = opts.category || "general";
    this.cwe = opts.cwe || null;
    this.owasp = opts.owasp || null;
    
    // Confidence is a float 0.0 to 1.0, default 0.5 if not provided
    this.confidence = opts.confidence !== undefined ? opts.confidence : 0.5;
    
    // AI enrichment fields (populated later by Orchestrator / AI engine)
    this.ai_verified = false;
    this.ai_confidence = null;
    this.secure_fix = opts.secure_fix || null;
    this.remediation_explanation = null;
  }

  toJSON() {
    return {
      id: this.id,
      scanner: this.scanner,
      file: this.file,
      line: this.line,
      column: this.column,
      severity: this.severity,
      title: this.title,
      description: this.description,
      evidence: this.evidence,
      category: this.category,
      cwe: this.cwe,
      owasp: this.owasp,
      confidence: this.confidence,
      ai_verified: this.ai_verified,
      ai_confidence: this.ai_confidence,
      secure_fix: this.secure_fix,
      remediation_explanation: this.remediation_explanation
    };
  }
}

module.exports = NormalizedFinding;
