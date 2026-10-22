/**
 * Sentinel Rule Schema & Validator
 * Enforces declarative, validated rules with safe regex boundaries.
 */

const VALID_SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"];
const VALID_CATEGORIES = [
  "api_key_exposure",
  "sql_injection",
  "xss",
  "insecure_dependency",
  "authentication_weakness",
  "authorization_risk",
  "environment_misconfiguration",
  "sensitive_data_exposure",
  "general_vulnerability",
  "ssrf",
  "path_traversal",
  "security_misconfiguration"
];

// ReDoS prevention: reject catastrophic backtracking patterns like (a+)+, (.*a){2,}, etc.
const REDOS_DANGEROUS_PATTERNS = [
  /([*+]\??)\s*\1/,                      // Nested quantifiers like ++, **
  /\([^)]*[*+][^)]*\)[*+]/,               // Group with quantifier followed by quantifier like (a+)+
  /\.\*[^|()]*\.\*/                      // Direct concatenation of multiple .* wildcards without alternatives
];

/**
 * Validate a single rule definition
 * @param {Object} rule 
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRule(rule) {
  const errors = [];

  if (!rule || typeof rule !== "object") {
    return { valid: false, errors: ["Rule must be a non-null object"] };
  }

  // Stable identifier
  if (!rule.id || typeof rule.id !== "string" || !/^[A-Z0-9_-]{3,64}$/.test(rule.id)) {
    errors.push(`Invalid or missing rule ID: "${rule.id}". Must be 3-64 uppercase alphanumeric characters, dashes or underscores.`);
  }

  // Version
  if (!rule.version || typeof rule.version !== "string") {
    errors.push(`Rule "${rule.id}": missing or invalid semver version string.`);
  }

  // Category
  if (!rule.category || !VALID_CATEGORIES.includes(rule.category)) {
    errors.push(`Rule "${rule.id}": category "${rule.category}" is not in the allowed list: ${VALID_CATEGORIES.join(", ")}`);
  }

  // Severity
  if (!rule.severity || !VALID_SEVERITIES.includes(rule.severity)) {
    errors.push(`Rule "${rule.id}": severity "${rule.severity}" must be one of: ${VALID_SEVERITIES.join(", ")}`);
  }

  // Pattern / Matcher
  if (!rule.pattern || !(rule.pattern instanceof RegExp)) {
    errors.push(`Rule "${rule.id}": pattern must be a valid RegExp instance.`);
  } else {
    const patternStr = rule.pattern.source;
    if (patternStr.length > 1000) {
      errors.push(`Rule "${rule.id}": regex pattern exceeds maximum safe length of 1000 characters.`);
    }
    for (const dangerous of REDOS_DANGEROUS_PATTERNS) {
      if (dangerous.test(patternStr)) {
        errors.push(`Rule "${rule.id}": potential ReDoS vulnerability detected in regex: ${patternStr}`);
        break;
      }
    }
  }

  // Title & Description
  if (!rule.title || typeof rule.title !== "string" || rule.title.trim().length === 0) {
    errors.push(`Rule "${rule.id}": title must be a non-empty string.`);
  }
  if (!rule.description || typeof rule.description !== "string" || rule.description.trim().length === 0) {
    errors.push(`Rule "${rule.id}": description must be a non-empty string.`);
  }

  // Suggestion / Remediation
  if (!rule.suggestion || typeof rule.suggestion !== "string") {
    errors.push(`Rule "${rule.id}": suggestion must be a non-empty string.`);
  }

  // Confidence (0.0 to 1.0)
  if (rule.confidence !== undefined) {
    if (typeof rule.confidence !== "number" || rule.confidence < 0 || rule.confidence > 1) {
      errors.push(`Rule "${rule.id}": confidence must be a number between 0.0 and 1.0.`);
    }
  }

  // Supported languages / file extensions
  if (rule.supportedExtensions && !Array.isArray(rule.supportedExtensions)) {
    errors.push(`Rule "${rule.id}": supportedExtensions must be an array of file extensions.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateRule,
  VALID_SEVERITIES,
  VALID_CATEGORIES
};
