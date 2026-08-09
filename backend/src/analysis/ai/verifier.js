class AIVerifier {
  /**
   * @param {Object} aiProvider - An instance of AIProvider
   */
  constructor(aiProvider) {
    this.ai = aiProvider;
  }

  /**
   * Performs multi-stage reasoning to verify a finding.
   * @param {Object} finding - A NormalizedFinding instance
   * @param {Object} repoContext - Context from RepositoryContext (routes, sinks, etc.)
   * @returns {Object} - The verified finding (mutated)
   */
  async verifyFinding(finding, repoContext = {}) {
    if (!this.ai.isConfigured()) return finding;
    
    // We skip AI reasoning for highly deterministic findings to save cost & time
    if (finding.scanner === 'OSVDependencyScanner') {
      finding.ai_verified = true;
      finding.ai_confidence = 1.0;
      return finding;
    }

    if (finding.scanner === 'SecretsScanner') {
      finding.ai_verified = true;
      finding.ai_confidence = 0.99;
      return finding;
    }

    const contextStr = repoContext.summary || "No specific repository context provided.";

    const prompt = `You are a Senior Security Engineer verifying a vulnerability detected by a static scanner.

### Finding Data
Title: ${finding.title}
Category: ${finding.category}
File: ${finding.file}
Evidence Snippet:
\`\`\`
${finding.evidence}
\`\`\`

### Repository Context
${contextStr}

### Multi-Stage Reasoning Task
You must evaluate this finding in stages and return a strictly formatted JSON object.

Stage 1 (Verification): Is this a true positive vulnerability or a false positive (e.g. commented code, safe test variable)?
Stage 2 (Context Reasoning): How does this code interact with the repository based on the context provided?
Stage 3 (Impact & Severity): If exploited, what is the impact? What is the final severity (Critical, High, Medium, Low)?
Stage 4 (Remediation): Provide the exact secure code replacement snippet that fixes the issue without breaking functionality.

Return ONLY the following JSON structure:
{
  "is_true_positive": boolean,
  "confidence": number, // 0.0 to 1.0
  "context_reasoning": "string",
  "impact_explanation": "string",
  "final_severity": "Critical" | "High" | "Medium" | "Low",
  "secure_fix_snippet": "string (or null if false positive)"
}`;

    try {
      const response = await this.ai.generateJSON(prompt);
      
      if (response && response.is_true_positive !== undefined) {
        // If the AI believes it's a false positive, we drop the confidence heavily.
        if (!response.is_true_positive) {
          finding.confidence = 0.1;
          finding.ai_verified = false;
        } else {
          finding.ai_verified = true;
          finding.ai_confidence = typeof response.confidence === 'number' ? response.confidence : 0.9;
          
          // Elevate or adjust based on AI consensus
          finding.severity = response.final_severity || finding.severity;
          finding.remediation_explanation = `${response.context_reasoning}\n\nImpact: ${response.impact_explanation}`;
          
          if (response.secure_fix_snippet) {
            finding.secure_fix = response.secure_fix_snippet;
          }
        }
      }
    } catch (err) {
      console.error(`AIVerifier failed for finding ${finding.id}: ${err.message}`);
    }

    return finding;
  }
  /**
   * Verifies an array of findings in a single LLM request (Batching)
   * @param {Array} findings - Array of NormalizedFinding instances
   * @param {Object} repoContext - Context from RepositoryContext
   * @returns {Array} - Array of verified findings (mutated)
   */
  async verifyFindingsBatch(findings, repoContext = {}) {
    if (!this.ai.isConfigured() || findings.length === 0) return findings;

    // Filter findings that don't need AI verification
    const findingsToVerify = [];
    for (const finding of findings) {
      if (finding.scanner === 'OSVDependencyScanner') {
        finding.ai_verified = true;
        finding.ai_confidence = 1.0;
      } else if (finding.scanner === 'SecretsScanner') {
        finding.ai_verified = true;
        finding.ai_confidence = 0.99;
      } else {
        findingsToVerify.push(finding);
      }
    }

    if (findingsToVerify.length === 0) return findings;

    const contextStr = repoContext.summary || "No specific repository context provided.";

    const prompt = `You are a Senior Security Engineer verifying a batch of vulnerabilities detected by a static scanner.

### Repository Context
${contextStr}

### Findings Data
${findingsToVerify.map((f, i) => `
Finding index: ${i}
Title: ${f.title}
Category: ${f.category}
File: ${f.file}
Evidence Snippet:
\`\`\`
${f.evidence}
\`\`\`
`).join('\n')}

### Multi-Stage Reasoning Task
You must evaluate EACH finding in stages and return a strictly formatted JSON object containing an array called "evaluations".

Return ONLY the following JSON structure:
{
  "evaluations": [
    {
      "finding_index": number, // Matches the index provided above
      "is_true_positive": boolean,
      "confidence": number, // 0.0 to 1.0
      "context_reasoning": "string",
      "impact_explanation": "string",
      "final_severity": "Critical" | "High" | "Medium" | "Low",
      "secure_fix_snippet": "string (or null if false positive)"
    }
  ]
}`;

    try {
      const response = await this.ai.generateJSON(prompt);
      
      if (response && Array.isArray(response.evaluations)) {
        for (const evalResult of response.evaluations) {
          const finding = findingsToVerify[evalResult.finding_index];
          if (!finding) continue;

          if (!evalResult.is_true_positive) {
            finding.confidence = 0.1;
            finding.ai_verified = false;
          } else {
            finding.ai_verified = true;
            finding.ai_confidence = typeof evalResult.confidence === 'number' ? evalResult.confidence : 0.9;
            finding.severity = evalResult.final_severity || finding.severity;
            finding.remediation_explanation = `${evalResult.context_reasoning}\n\nImpact: ${evalResult.impact_explanation}`;
            
            if (evalResult.secure_fix_snippet) {
              finding.secure_fix = evalResult.secure_fix_snippet;
            }
          }
        }
      }
    } catch (err) {
      console.error(`AIVerifier batch failed: ${err.message}`);
    }

    return findings;
  }
  /**
   * Semantically validates if a code fix resolves a specific vulnerability.
   * @param {string} originalCode
   * @param {string} fixedCode
   * @param {string} category
   * @returns {Object} { isValid: boolean, newIssuesIntroduced: number, newIssues: array, explanation: string }
   */
  async verifyFix(originalCode, fixedCode, category) {
    if (!this.ai.isConfigured()) {
      return { isValid: false, newIssuesIntroduced: 0, newIssues: [], explanation: "AI not configured for verification." };
    }

    const prompt = `You are a Senior Security Engineer validating a proposed code fix.
An automated system attempted to fix a vulnerability of type "${category}".

### Original Vulnerable Code:
\`\`\`
${originalCode}
\`\`\`

### Proposed Fixed Code:
\`\`\`
${fixedCode}
\`\`\`

### Task:
Evaluate the fixed code to determine if it successfully mitigates the ${category} vulnerability WITHOUT breaking the original functionality and WITHOUT introducing any new security vulnerabilities (like hardcoded secrets, new injections, etc.).

Return ONLY the following JSON structure:
{
  "isValid": boolean,
  "newIssuesIntroduced": number,
  "newIssues": [{"title": "string", "severity": "High"}], // Empty array if no new issues
  "explanation": "Brief explanation of why the fix is valid or invalid."
}`;

    try {
      const response = await this.ai.generateJSON(prompt);
      if (response && response.isValid !== undefined) {
        return {
          isValid: response.isValid,
          newIssuesIntroduced: response.newIssuesIntroduced || 0,
          newIssues: response.newIssues || [],
          explanation: response.explanation || ""
        };
      }
    } catch (err) {
      console.error("AIVerifier fix verification failed:", err.message);
    }
    
    return { isValid: false, newIssuesIntroduced: 0, newIssues: [], explanation: "Verification failed due to error." };
  }
}

module.exports = AIVerifier;
