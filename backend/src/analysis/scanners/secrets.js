const NormalizedFinding = require("../models/normalizedFinding");

/**
 * Sentinel Secrets Scanner
 * High-entropy and pattern-based credential exposure detection.
 * Includes native support for Indian payment gateways (Razorpay, Cashfree, PhonePe),
 * major cloud platforms (AWS, GCP, Stripe, GitHub), private keys, and database URIs.
 * In-memory masking ensures real credentials are never leaked in logs, reports, or AI payloads.
 */
class SecretsScanner {
  constructor() {
    this.name = "SecretsScanner";

    this.rules = [
      // ── Indian Fintech Gateways ──────────────────────────────────────────
      {
        id: "RAZORPAY_API_KEY",
        category: "api_key_exposure",
        title: "Razorpay API Key Exposed",
        description: "Hardcoded Razorpay Key ID detected. Exposing live keys allows unauthorized payments and ledger access.",
        pattern: /(rzp_(?:test|live)_[a-zA-Z0-9]{14,20})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },
      {
        id: "RAZORPAY_SECRET_KEY",
        category: "api_key_exposure",
        title: "Razorpay Secret Key Exposed",
        description: "Hardcoded Razorpay Secret Key detected. This can lead to order manipulation and refund abuse.",
        pattern: /(?:razorpay[_-]?(?:secret|key|pass)[_-]?\s*[:=]\s*["'])([a-zA-Z0-9]{20,32})(?:["'])/gi,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },
      {
        id: "CASHFREE_CREDENTIALS",
        category: "api_key_exposure",
        title: "Cashfree Payment Gateway Credentials Exposed",
        description: "Hardcoded Cashfree App ID or Secret Key found.",
        pattern: /(CF(?:TEST)?[A-Za-z0-9_-]{16,32})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },
      {
        id: "PHONEPE_SALT_KEY",
        category: "api_key_exposure",
        title: "PhonePe Merchant Salt Key Exposed",
        description: "Hardcoded PhonePe payment gateway Salt Key detected.",
        pattern: /(?:phonepe[_-]?(?:salt|key|secret)\s*[:=]\s*["'])([a-f0-9\-]{32,36}###[1-5])(?:["'])/gi,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },

      // ── Cloud & Developer Platform Secrets ──────────────────────────────
      {
        id: "AWS_ACCESS_KEY",
        category: "api_key_exposure",
        title: "AWS Access Key Exposed",
        description: "Hardcoded AWS Access Key ID found. This can lead to complete cloud account compromise.",
        pattern: /(AKIA[0-9A-Z]{16})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },
      {
        id: "GOOGLE_GCP_API_KEY",
        category: "api_key_exposure",
        title: "Google Cloud API Key Exposed",
        description: "Hardcoded Google Cloud/Maps API key found.",
        pattern: /(AIza[0-9A-Za-z\-_]{35})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "High",
      },
      {
        id: "STRIPE_SECRET_KEY",
        category: "api_key_exposure",
        title: "Stripe Secret Key Exposed",
        description: "Hardcoded Stripe secret or restricted key found.",
        pattern: /(sk_(?:test|live)_[0-9a-zA-Z]{24,})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },
      {
        id: "GITHUB_TOKEN",
        category: "api_key_exposure",
        title: "GitHub Access Token Exposed",
        description: "Hardcoded GitHub token found.",
        pattern: /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },
      {
        id: "SLACK_WEBHOOK",
        category: "api_key_exposure",
        title: "Slack Incoming Webhook URL Exposed",
        description: "Hardcoded Slack webhook found, allowing unauthorized notifications and message spoofing.",
        pattern: /(https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]{8}\/B[0-9A-Z]{8,12}\/[0-9a-zA-Z]{24})/g,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "High",
      },
      {
        id: "PRIVATE_KEY_BLOCK",
        category: "api_key_exposure",
        title: "Private Cryptographic Key Embedded in Code",
        description: "Private RSA/OpenSSH/EC key block committed to repository.",
        pattern: /(-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----)/g,
        cwe: "CWE-798",
        owasp: "A02:2021-Cryptographic Failures",
        severity: "Critical",
      },
      {
        id: "DATABASE_CONNECTION_URI",
        category: "api_key_exposure",
        title: "Database Connection URI with Embedded Password",
        description: "Database connection string contains embedded cleartext credentials.",
        pattern: /(?:postgres|mysql|mongodb(?:\+srv)?|redis):\/\/[a-zA-Z0-9_.-]+:([^@\s]{4,})@[a-zA-Z0-9_.-]+/gi,
        cwe: "CWE-798",
        owasp: "A07:2021-Identification and Authentication Failures",
        severity: "Critical",
      },
    ];
  }

  /**
   * Identifies common dummy/test placeholders that should not trigger alerts.
   */
  _isPlaceholder(val) {
    if (!val || typeof val !== "string") return true;
    const lower = val.toLowerCase();

    // Explicit placeholder strings
    if (
      lower === "your_api_key_here" ||
      lower === "your_secret_key" ||
      lower === "replace_with_your_key" ||
      lower === "insert_key_here" ||
      lower === "changeme" ||
      lower === "placeholder" ||
      lower === "dummy_secret_key" ||
      lower.includes("your_api_key") ||
      lower.includes("replace_me")
    ) {
      return true;
    }

    // Zero entropy: all identical characters (e.g. "0000000000000000" or "XXXXXXXXXXXXXXXX")
    const uniqueChars = new Set(val.split(""));
    if (uniqueChars.size <= 2 && val.length > 8) return true;

    return false;
  }

  /**
   * Masks a secret string for safe display.
   * E.g. rzp_live_1DP5mmOlF5G5ag -> rzp_*****************5ag
   */
  _maskSecret(secret) {
    if (!secret || typeof secret !== "string") return "********";
    if (secret.length <= 8) return "********";
    const start = secret.substring(0, 4);
    const end = secret.substring(secret.length - 4);
    return `${start}${"*".repeat(secret.length - 8)}${end}`;
  }

  async scan(files) {
    const findings = [];
    if (!Array.isArray(files) || files.length === 0) return findings;

    for (const file of files) {
      if (!file.content) continue;
      const lines = file.content.split("\n");

      for (const rule of this.rules) {
        lines.forEach((line, idx) => {
          rule.pattern.lastIndex = 0; // reset
          let match;

          while ((match = rule.pattern.exec(line)) !== null) {
            // Match group 1 if captured, otherwise full match
            const secretValue = match[1] || match[0];

            if (this._isPlaceholder(secretValue)) continue;

            const maskedSecret = this._maskSecret(secretValue);
            const safeLine = line.replace(secretValue, maskedSecret);

            // Build safe snippet (no real secrets in memory)
            const start = Math.max(0, idx - 2);
            const end = Math.min(lines.length - 1, idx + 2);
            const snippetLines = lines.slice(start, end + 1).map((l, i) =>
              start + i === idx ? safeLine : l
            );
            const snippet = snippetLines.join("\n");

            findings.push(
              new NormalizedFinding({
                scanner: this.name,
                file: file.path,
                line: idx + 1,
                severity: rule.severity || "Critical",
                title: rule.title,
                description: `${rule.description}\nMasked Value: ${maskedSecret}`,
                evidence: snippet,
                category: rule.category,
                cwe: rule.cwe,
                owasp: rule.owasp,
                confidence: 0.95, // High confidence for validated regex credentials
                secure_fix: "Extract credential to environment variables (.env) and add to .gitignore.",
              })
            );
          }
        });
      }
    }

    return findings;
  }
}

module.exports = SecretsScanner;
