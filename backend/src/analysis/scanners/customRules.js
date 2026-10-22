/**
 * Sentinel Custom Rules SAST Scanner
 * Driven dynamically by the Sentinel RuleRegistry.
 * Separates scanner execution loop from rule definitions, metadata, and validation.
 */

const NormalizedFinding = require("../models/normalizedFinding");
const { globalRuleRegistry } = require("../rules/ruleRegistry");

class CustomRulesScanner {
  /**
   * @param {Object} options
   * @param {Object} options.registry - RuleRegistry instance
   * @param {number} options.maxAvgLineLength - Max average line length to avoid minified bundle freezing (default: 200)
   * @param {number} options.contextLines - Number of context lines before and after (default: 3)
   */
  constructor(options = {}) {
    this.name = "CustomRuleScanner";
    this.registry = options.registry || globalRuleRegistry;
    this.maxAvgLineLength = options.maxAvgLineLength || 200;
    this.contextLines = options.contextLines || 3;
    this.version = "2.0.0";
    this.status = "COMPLETED";
    this.error = null;
  }

  /**
   * Dynamic scanner capability check
   * Custom rule engine runs in-process with Node.js and is always operational.
   */
  async isAvailable() {
    return {
      available: true,
      engine: this.name,
      version: this.version,
      status: "OPERATIONAL"
    };
  }

  /**
   * Scan files using active validated rules from the registry
   * @param {Array<{ path: string, content: string, size?: number }>} files
   * @param {Object} scanOptions
   */
  async scan(files, scanOptions = {}) {
    const findings = [];
    const activeRules = this.registry.getActiveRules();

    if (!Array.isArray(files) || files.length === 0) {
      return findings;
    }

    for (const file of files) {
      if (!file || !file.content) continue;

      // Skip large minified files safely
      const lines = file.content.split("\n");
      const avgLineLength = file.content.length / Math.max(1, lines.length);
      if (avgLineLength > this.maxAvgLineLength) {
        continue;
      }

      for (const rule of activeRules) {
        // Optional file extension filter if rule restricts it
        if (rule.supportedExtensions && Array.isArray(rule.supportedExtensions)) {
          const matchedExt = rule.supportedExtensions.some(ext => file.path.endsWith(ext));
          if (!matchedExt) continue;
        }

        lines.forEach((line, idx) => {
          rule.pattern.lastIndex = 0; // reset regex state
          if (rule.pattern.test(line)) {
            const lineNumber = idx + 1;
            
            // Extract configurable context lines
            const start = Math.max(0, idx - this.contextLines);
            const end = Math.min(lines.length - 1, idx + this.contextLines);
            const snippetLines = lines.slice(start, end + 1);
            const snippet = snippetLines.join("\n");

            findings.push(new NormalizedFinding({
              scanner: this.name,
              file: file.path,
              line: lineNumber,
              column: null,
              severity: rule.severity,
              title: rule.title,
              description: rule.description,
              evidence: snippet,
              category: rule.category,
              cwe: rule.cwe,
              owasp: rule.owasp,
              confidence: typeof rule.confidence === "number" ? rule.confidence : 0.6
            }));
          }
        });
      }
    }

    return findings;
  }
}

module.exports = CustomRulesScanner;
