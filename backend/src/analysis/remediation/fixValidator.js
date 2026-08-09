/**
 * Fix Validator
 * 
 * Re-runs the scanner pipeline against a proposed code fix IN MEMORY
 * to verify that the vulnerability is resolved before allowing auto-commit to GitHub.
 * 
 * This ensures Sentinel never blindly pushes AI-generated code that still contains
 * the original vulnerability (or introduces new ones).
 */

const AIVerifier = require("../ai/verifier");
const AIProvider = require("../ai/provider");

class FixValidator {
  constructor() {
    this.name = "FixValidator";
    this.aiProvider = new AIProvider();
    this.aiVerifier = new AIVerifier(this.aiProvider);
  }

  /**
   * Validates a proposed code fix semantically using the AIVerifier.
   * 
   * @param {string} originalCode - The original vulnerable code
   * @param {string} fixedCode - The AI-proposed secure code
   * @param {string} fileName - The file path/name
   * @param {string} originalCategory - The category of the original vulnerability
   * @returns {Object} Validation result
   */
  async validate(originalCode, fixedCode, fileName, originalCategory) {
    const result = {
      isValid: false,
      originalIssueCount: 1,
      fixedIssueCount: 0,
      originalIssueResolved: false,
      newIssuesIntroduced: 0,
      newIssues: [],
      verdict: "UNKNOWN",
      explanation: ""
    };

    try {
      const verification = await this.aiVerifier.verifyFix(originalCode, fixedCode, originalCategory);
      
      result.isValid = verification.isValid;
      result.newIssuesIntroduced = verification.newIssuesIntroduced;
      result.newIssues = verification.newIssues;
      result.explanation = verification.explanation;
      result.originalIssueResolved = verification.isValid;

      if (result.isValid && result.newIssuesIntroduced === 0) {
        result.verdict = "PASS";
      } else if (result.isValid && result.newIssuesIntroduced > 0) {
        result.isValid = false;
        result.verdict = "WARN";
      } else {
        result.verdict = "BLOCK";
      }

    } catch (err) {
      console.error("FixValidator error:", err.message);
      result.verdict = "ERROR";
      result.explanation = `Validation failed due to an internal error: ${err.message}`;
    }

    return result;
  }
}

module.exports = FixValidator;
