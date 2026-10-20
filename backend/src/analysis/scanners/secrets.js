const NormalizedFinding = require("../models/normalizedFinding");

class SecretsScanner {
  constructor() {
    this.name = "SecretsScanner";
    // Regex patterns designed to capture the exact secret for redaction
    this.rules = [
      {
        id: "AWS_ACCESS_KEY",
        category: "api_key_exposure",
        title: "AWS Access Key Exposed",
        description: "Hardcoded AWS Access Key ID found. This can lead to complete cloud account compromise.",
        pattern: /(AKIA[0-9A-Z]{16})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures"
      },
      {
        id: "GOOGLE_GCP_API_KEY",
        category: "api_key_exposure",
        title: "Google Cloud API Key Exposed",
        description: "Hardcoded Google Cloud/Maps API key found.",
        pattern: /(AIza[0-9A-Za-z\-_]{35})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures"
      },
      {
        id: "STRIPE_SECRET_KEY",
        category: "api_key_exposure",
        title: "Stripe Secret Key Exposed",
        description: "Hardcoded Stripe secret or restricted key found.",
        pattern: /(sk_(?:test|live)_[0-9a-zA-Z]{24,})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures"
      },
      {
        id: "GITHUB_PAT",
        category: "api_key_exposure",
        title: "GitHub Personal Access Token",
        description: "Hardcoded GitHub token found.",
        pattern: /(ghp_[a-zA-Z0-9]{36})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures"
      }
    ];
  }

  /**
   * Masks a secret string for safe display
   * E.g., AKIA1234567890ABCDEF -> AKIA************CDEF
   */
  _maskSecret(secret) {
    if (secret.length <= 8) return "********";
    const start = secret.substring(0, 4);
    const end = secret.substring(secret.length - 4);
    return `${start}${"*".repeat(secret.length - 8)}${end}`;
  }

  async scan(files) {
    const findings = [];

    for (const file of files) {
      if (!file.content) continue;
      const lines = file.content.split("\n");

      for (const rule of this.rules) {
        lines.forEach((line, idx) => {
          rule.pattern.lastIndex = 0; // reset
          let match;
          while ((match = rule.pattern.exec(line)) !== null) {
            const secretValue = match[1];
            const maskedSecret = this._maskSecret(secretValue);
            const safeLine = line.replace(secretValue, maskedSecret);
            
            // Build safe snippet (no real secrets in memory)
            const start = Math.max(0, idx - 2);
            const end = Math.min(lines.length - 1, idx + 2);
            const snippetLines = lines.slice(start, end + 1).map((l, i) => 
              (start + i === idx) ? safeLine : l
            );
            const snippet = snippetLines.join("\n");

            findings.push(new NormalizedFinding({
              scanner: this.name,
              file: file.path,
              line: idx + 1,
              severity: "Critical",
              title: rule.title,
              description: `${rule.description}\nMasked Value: ${maskedSecret}`,
              evidence: snippet,
              category: rule.category,
              cwe: rule.cwe,
              owasp: rule.owasp,
              confidence: 0.95 // Direct high-entropy secret matches have high confidence
            }));
          }
        });
      }
    }

    return findings;
  }
}

module.exports = SecretsScanner;
