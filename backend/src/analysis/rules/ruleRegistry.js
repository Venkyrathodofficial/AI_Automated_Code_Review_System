/**
 * Sentinel Dynamic Rule Registry
 * Manages validated rules, versions, runtime toggles, and safety checks.
 */

const { validateRule } = require("./ruleSchema");
const defaultRules = require("./defaultRules");

class RuleRegistry {
  constructor() {
    this.rules = new Map();
    this.validationErrors = [];
    
    // Automatically load and validate the default rules
    this.loadRules(defaultRules, "default-v1");
  }

  /**
   * Load an array of rules with validation
   * @param {Array} ruleList 
   * @param {string} packName 
   * @returns {{ loaded: number, failed: number, errors: string[] }}
   */
  loadRules(ruleList, packName = "unnamed") {
    let loaded = 0;
    let failed = 0;
    const errors = [];

    if (!Array.isArray(ruleList)) {
      const err = `Rule pack "${packName}" must be an array of rule definitions.`;
      this.validationErrors.push(err);
      return { loaded: 0, failed: 1, errors: [err] };
    }

    for (const ruleDef of ruleList) {
      const validation = validateRule(ruleDef);
      if (!validation.valid) {
        failed++;
        const msg = `[${packName}] Failed to register rule ${ruleDef?.id || "unknown"}: ${validation.errors.join("; ")}`;
        this.validationErrors.push(msg);
        errors.push(msg);
        console.warn(`[Sentinel RuleRegistry] ${msg}`);
        continue;
      }

      // Safe clone and register
      this.rules.set(ruleDef.id, {
        ...ruleDef,
        pack: packName,
        enabled: ruleDef.enabled !== false // enabled by default
      });
      loaded++;
    }

    return { loaded, failed, errors };
  }

  /**
   * Register or update a single rule dynamically
   * @param {Object} ruleDef 
   * @returns {{ success: boolean, errors?: string[] }}
   */
  registerRule(ruleDef) {
    const validation = validateRule(ruleDef);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    this.rules.set(ruleDef.id, {
      ...ruleDef,
      enabled: ruleDef.enabled !== false
    });
    return { success: true };
  }

  /**
   * Enable or disable a rule dynamically
   * @param {string} ruleId 
   * @param {boolean} enabled 
   * @returns {boolean} whether rule was found
   */
  setRuleStatus(ruleId, enabled) {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = !!enabled;
    return true;
  }

  /**
   * Get all active (enabled) rules
   * @returns {Array}
   */
  getActiveRules() {
    return Array.from(this.rules.values()).filter(r => r.enabled);
  }

  /**
   * Get all registered rules with metadata
   * @returns {Array}
   */
  getAllRules() {
    return Array.from(this.rules.values()).map(r => ({
      id: r.id,
      version: r.version,
      category: r.category,
      severity: r.severity,
      title: r.title,
      description: r.description,
      suggestion: r.suggestion,
      cwe: r.cwe,
      owasp: r.owasp,
      confidence: r.confidence,
      enabled: r.enabled,
      pack: r.pack
    }));
  }

  /**
   * Get a specific rule by ID
   * @param {string} ruleId 
   */
  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Clear all rules (primarily for isolated test fixtures)
   */
  clear() {
    this.rules.clear();
    this.validationErrors = [];
  }
}

// Global singleton instance
const globalRuleRegistry = new RuleRegistry();

module.exports = {
  RuleRegistry,
  globalRuleRegistry
};
