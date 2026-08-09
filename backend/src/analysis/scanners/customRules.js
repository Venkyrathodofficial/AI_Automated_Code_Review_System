const NormalizedFinding = require("../models/normalizedFinding");

class CustomRulesScanner {
  constructor() {
    this.name = "CustomRuleScanner";
    this.rules = [
      // 1. API Key Exposure
      {
        id: "API_KEY_EXPOSURE",
        category: "api_key_exposure",
        pattern: /(?:gemini|openai|stripe|aws|azure|firebase|github|jwt|secret|key|token|passwd|auth)[_-]?(?:key|secret|token|password|cred|pass|auth|cert|hash|salt|private|api)?\s*[:=]\s*["'](?:sb_publishable_|sk_|sk-proj-|AIzaSy|amzn\.mws\.|ghp_|gho_|ghu_|ghs_|eyJhbGciOi)[a-zA-Z0-9_\-\+]{4,}/gi,
        severity: "Critical",
        title: "Hardcoded API Key or Secret Token",
        description: "Private keys, tokens, or credentials embedded directly in code can be compromised through version control.",
        suggestion: "Extract secrets to environment variables (.env files) or use a managed secret manager.",
        cwe: "CWE-798"
      },
      {
        id: "API_KEY_VARIABLE",
        category: "api_key_exposure",
        pattern: /(?:api[_-]?key|client[_-]?secret|jwt[_-]?secret|private[_-]?key|stripe[_-]?secret|github[_-]?token)\s*[:=]\s*["'][a-zA-Z0-9_\-\+\.]{16,}["']/gi,
        severity: "Critical",
        title: "Suspicious Hardcoded Credential Variable",
        description: "A variable named after an API key or secret has been assigned a hardcoded string literal.",
        suggestion: "Replace the hardcoded secret string with process.env.YOUR_VARIABLE_NAME.",
        cwe: "CWE-798"
      },
      // 2. SQL Injection Risk
      {
        id: "SQL_INJECTION",
        category: "sql_injection",
        pattern: /SELECT\s+.+\s+FROM\s+.+\s+WHERE\s+.+['"\+]|db\.(?:query|execute|raw)\s*\(\s*['"`].*['"`]\s*\+/gi,
        severity: "Critical",
        title: "SQL Injection Risk via String Concatenation",
        description: "Building SQL queries by concatenating variables directly allows malicious input to alter query logic.",
        suggestion: "Use parameterized queries, placeholders (?), or a modern ORM (Prisma, Sequelize, Knex).",
        cwe: "CWE-89",
        owasp: "A03:2021-Injection"
      },
      // 3. XSS Vulnerability
      {
        id: "XSS_INNERHTML",
        category: "xss",
        pattern: /innerHTML\s*=|dangerouslySetInnerHTML/gi,
        severity: "High",
        title: "Cross-Site Scripting (XSS) via innerHTML",
        description: "Assigning unsanitized user input directly to innerHTML can allow malicious script injection in the browser.",
        suggestion: "Use textContent for plain text, or pass HTML through a sanitizer like DOMPurify first.",
        cwe: "CWE-79",
        owasp: "A03:2021-Injection"
      },
      {
        id: "XSS_DOCWRITE",
        category: "xss",
        pattern: /document\.write\s*\(/gi,
        severity: "High",
        title: "Cross-Site Scripting (XSS) via document.write()",
        description: "document.write() is a deprecated API that can cause security breaches and performance bottlenecks.",
        suggestion: "Use safer DOM APIs like createElement() and appendChild().",
        cwe: "CWE-79",
        owasp: "A03:2021-Injection"
      },
      // 4. Insecure Dependency
      {
        id: "INSECURE_DEPENDENCY",
        category: "insecure_dependency",
        pattern: /"dependencies"\s*:\s*\{[^}]*"\*"/g,
        severity: "High",
        title: "Wildcard Dependency Version (*)",
        description: "Using wildcard package versions pulls in untested, potentially breaking, or compromised dependency updates.",
        suggestion: "Lock package versions or use standard semver ranges (e.g. ^1.2.0).",
        cwe: "CWE-1104"
      },
      // 5. Authentication Weakness
      {
        id: "WEAK_HASH",
        category: "authentication_weakness",
        pattern: /createHash\s*\(\s*['"](?:md5|sha1)/gi,
        severity: "High",
        title: "Weak Cryptographic Hashing Algorithm",
        description: "Algorithms like MD5 and SHA-1 are cryptographically broken and prone to collision attacks.",
        suggestion: "Upgrade to safer hashing standards like SHA-256, bcrypt, or Argon2.",
        cwe: "CWE-328",
        owasp: "A02:2021-Cryptographic Failures"
      },
      {
        id: "HARDCODED_PASSWORD",
        category: "authentication_weakness",
        pattern: /password\s*===\s*["'][^"']+["']/gi,
        severity: "Critical",
        title: "Hardcoded Password Comparison",
        description: "Verifying user credentials against a static, hardcoded string is highly vulnerable to discovery.",
        suggestion: "Verify password hashes retrieved from a database using secure compare methods.",
        cwe: "CWE-259",
        owasp: "A07:2021-Identification and Authentication Failures"
      },
      // 6. Authorization Risk
      {
        id: "AUTHORIZATION_BYPASS",
        category: "authorization_risk",
        pattern: /role\s*===\s*null|\bcheckRole\b|\bhasRole\b/gi,
        severity: "Medium",
        title: "Weak Authorization Role Checking",
        description: "Ensure that sensitive access checks perform positive authorization validations and verify scopes correctly.",
        suggestion: "Enforce strict, centralized role-based access control (RBAC) middleware for sensitive routes.",
        cwe: "CWE-862",
        owasp: "A01:2021-Broken Access Control"
      },
      // 7. Environment Misconfiguration
      {
        id: "DEBUG_MODE_ENABLED",
        category: "environment_misconfiguration",
        pattern: /debug\s*=\s*(?:true|1)|process\.env\.NODE_ENV\s*===\s*['"]development['"]/gi,
        severity: "Medium",
        title: "Debug Mode or Environment Flag Leak",
        description: "Enabling detailed debug modes in production can leak system info, internal stack traces, and variables.",
        suggestion: "Ensure debug options are controlled strictly by node environments (process.env.NODE_ENV === 'production').",
        cwe: "CWE-215",
        owasp: "A05:2021-Security Misconfiguration"
      },
      // 8. Sensitive Data Exposure
      {
        id: "UNSAFE_LOGGING",
        category: "sensitive_data_exposure",
        pattern: /console\.(log|info|debug)\s*\(.*(?:password|secret|email|phone|ssn|token)/gi,
        severity: "High",
        title: "Unsafe Logging of Sensitive Information",
        description: "Printing variables that hold secrets, credentials, or personal information (PII) exposes them in console logs.",
        suggestion: "Filter or sanitize variables before logging them, or use a secure logger that masks private data.",
        cwe: "CWE-532",
        owasp: "A09:2021-Security Logging and Monitoring Failures"
      },
      // 9. General Vulnerability
      {
        id: "EVAL_USAGE",
        category: "general_vulnerability",
        pattern: /eval\s*\(/gi,
        severity: "Critical",
        title: "Arbitrary Code Execution via eval()",
        description: "eval() executes any string passed to it, opening the door for complete system compromise.",
        suggestion: "Refactor code to use JSON.parse() or specific functional handlers.",
        cwe: "CWE-95",
        owasp: "A03:2021-Injection"
      },
      {
        id: "SHELL_EXECUTION",
        category: "general_vulnerability",
        pattern: /exec\s*\(\s*['"`]|child_process/gi,
        severity: "Critical",
        title: "Command Injection via Process Spawn",
        description: "Invoking command shells dynamically can allow command injection attacks if arguments are raw user inputs.",
        suggestion: "Use safer alternatives like execFile() or validate and escape all inputs rigorously.",
        cwe: "CWE-78",
        owasp: "A03:2021-Injection"
      }
    ];
  }

  async scan(files) {
    const findings = [];

    for (const file of files) {
      if (!file.content) continue;

      // Skip large/minified files (naive check: avg line length > 200)
      const lines = file.content.split("\n");
      const avgLineLength = file.content.length / Math.max(1, lines.length);
      if (avgLineLength > 200) continue;

      for (const rule of this.rules) {
        lines.forEach((line, idx) => {
          rule.pattern.lastIndex = 0; // reset regex state
          if (rule.pattern.test(line)) {
            const lineNumber = idx + 1;
            
            // Extract 3 lines of context before and after
            const start = Math.max(0, idx - 3);
            const end = Math.min(lines.length - 1, idx + 3);
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
              confidence: 0.6 // Regex matches are medium confidence (0.6)
            }));
          }
        });
      }
    }

    return findings;
  }
}

module.exports = CustomRulesScanner;
