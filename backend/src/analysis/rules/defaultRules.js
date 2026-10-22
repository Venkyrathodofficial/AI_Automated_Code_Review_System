/**
 * Sentinel Default SAST Rule Pack (v1.0.0)
 * Versioned, validated rules with CWE/OWASP mappings and fixtures.
 */

const defaultRules = [
  // 1. API Key Exposure
  {
    id: "API_KEY_EXPOSURE",
    version: "1.0.0",
    category: "api_key_exposure",
    pattern: /(?:gemini|openai|stripe|aws|azure|firebase|github|jwt|secret|key|token|passwd|auth)[_-]?(?:key|secret|token|password|cred|pass|auth|cert|hash|salt|private|api)?\s*[:=]\s*["'](?:sb_publishable_|sk_|sk-proj-|AIzaSy|amzn\.mws\.|ghp_|gho_|ghu_|ghs_|eyJhbGciOi)[a-zA-Z0-9_\-\+]{4,}/gi,
    severity: "Critical",
    confidence: 0.9,
    title: "Hardcoded API Key or Secret Token",
    description: "Private keys, tokens, or credentials embedded directly in code can be compromised through version control.",
    suggestion: "Extract secrets to environment variables (.env files) or use a managed secret manager.",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    enabled: true,
    testFixtures: {
      positive: ['const apiKey = "AIzaSyDa318991823908123";'],
      negative: ['const apiKey = process.env.API_KEY;']
    }
  },
  {
    id: "API_KEY_VARIABLE",
    version: "1.0.0",
    category: "api_key_exposure",
    pattern: /(?:api[_-]?key|client[_-]?secret|jwt[_-]?secret|private[_-]?key|stripe[_-]?secret|github[_-]?token)\s*[:=]\s*["'][a-zA-Z0-9_\-\+\.]{16,}["']/gi,
    severity: "Critical",
    confidence: 0.85,
    title: "Suspicious Hardcoded Credential Variable",
    description: "A variable named after an API key or secret has been assigned a hardcoded string literal.",
    suggestion: "Replace the hardcoded secret string with process.env.YOUR_VARIABLE_NAME.",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    enabled: true,
    testFixtures: {
      positive: ['const client_secret = "abcdef1234567890abcdef";'],
      negative: ['const client_secret = process.env.CLIENT_SECRET;']
    }
  },
  // 2. SQL Injection Risk
  {
    id: "SQL_INJECTION",
    version: "1.0.0",
    category: "sql_injection",
    pattern: /SELECT\s+.+\s+FROM\s+.+\s+WHERE\s+.+['"\+]|db\.(?:query|execute|raw)\s*\(\s*['"`].*['"`]\s*\+/gi,
    severity: "Critical",
    confidence: 0.8,
    title: "SQL Injection Risk via String Concatenation",
    description: "Building SQL queries by concatenating variables directly allows malicious input to alter query logic.",
    suggestion: "Use parameterized queries, placeholders (?), or a modern ORM (Prisma, Sequelize, Knex).",
    cwe: "CWE-89",
    owasp: "A03:2021-Injection",
    enabled: true,
    testFixtures: {
      positive: ['const q = "SELECT * FROM users WHERE id = " + userId;'],
      negative: ['const q = "SELECT * FROM users WHERE id = ?";']
    }
  },
  // 3. XSS Vulnerability
  {
    id: "XSS_INNERHTML",
    version: "1.0.0",
    category: "xss",
    pattern: /innerHTML\s*=|dangerouslySetInnerHTML/gi,
    severity: "High",
    confidence: 0.75,
    title: "Cross-Site Scripting (XSS) via innerHTML",
    description: "Assigning unsanitized user input directly to innerHTML can allow malicious script injection in the browser.",
    suggestion: "Use textContent for plain text, or pass HTML through a sanitizer like DOMPurify first.",
    cwe: "CWE-79",
    owasp: "A03:2021-Injection",
    enabled: true,
    testFixtures: {
      positive: ['element.innerHTML = userContent;'],
      negative: ['element.textContent = userContent;']
    }
  },
  {
    id: "XSS_DOCWRITE",
    version: "1.0.0",
    category: "xss",
    pattern: /document\.write\s*\(/gi,
    severity: "High",
    confidence: 0.9,
    title: "Cross-Site Scripting (XSS) via document.write()",
    description: "document.write() is a deprecated API that can cause security breaches and performance bottlenecks.",
    suggestion: "Use safer DOM APIs like createElement() and appendChild().",
    cwe: "CWE-79",
    owasp: "A03:2021-Injection",
    enabled: true,
    testFixtures: {
      positive: ['document.write(userInput);'],
      negative: ['document.body.appendChild(node);']
    }
  },
  // 4. Insecure Dependency Wildcards
  {
    id: "INSECURE_DEPENDENCY",
    version: "1.0.0",
    category: "insecure_dependency",
    pattern: /"dependencies"\s*:\s*\{[^}]*"\*"/g,
    severity: "High",
    confidence: 0.85,
    title: "Wildcard Dependency Version (*)",
    description: "Using wildcard package versions pulls in untested, potentially breaking, or compromised dependency updates.",
    suggestion: "Lock package versions or use standard semver ranges (e.g. ^1.2.0).",
    cwe: "CWE-1104",
    enabled: true,
    testFixtures: {
      positive: ['"dependencies": { "express": "*" }'],
      negative: ['"dependencies": { "express": "^4.19.2" }']
    }
  },
  // 5. Authentication Weakness
  {
    id: "WEAK_HASH",
    version: "1.0.0",
    category: "authentication_weakness",
    pattern: /createHash\s*\(\s*['"](?:md5|sha1)/gi,
    severity: "High",
    confidence: 0.85,
    title: "Weak Cryptographic Hashing Algorithm",
    description: "Algorithms like MD5 and SHA-1 are cryptographically broken and prone to collision attacks.",
    suggestion: "Upgrade to safer hashing standards like SHA-256, bcrypt, or Argon2.",
    cwe: "CWE-328",
    owasp: "A02:2021-Cryptographic Failures",
    enabled: true,
    testFixtures: {
      positive: ['crypto.createHash("md5").update(pass).digest();'],
      negative: ['crypto.createHash("sha256").update(pass).digest();']
    }
  },
  {
    id: "HARDCODED_PASSWORD",
    version: "1.0.0",
    category: "authentication_weakness",
    pattern: /password\s*===\s*["'][^"']+["']/gi,
    severity: "Critical",
    confidence: 0.9,
    title: "Hardcoded Password Comparison",
    description: "Verifying user credentials against a static, hardcoded string is highly vulnerable to discovery.",
    suggestion: "Verify password hashes retrieved from a database using secure compare methods.",
    cwe: "CWE-259",
    owasp: "A07:2021-Identification and Authentication Failures",
    enabled: true,
    testFixtures: {
      positive: ['if (password === "Admin123!") login();'],
      negative: ['if (await bcrypt.compare(password, user.hash)) login();']
    }
  },
  // 6. Authorization Risk
  {
    id: "AUTHORIZATION_BYPASS",
    version: "1.0.0",
    category: "authorization_risk",
    pattern: /role\s*===\s*null|\bcheckRole\b|\bhasRole\b/gi,
    severity: "Medium",
    confidence: 0.6,
    title: "Weak Authorization Role Checking",
    description: "Ensure that sensitive access checks perform positive authorization validations and verify scopes correctly.",
    suggestion: "Enforce strict, centralized role-based access control (RBAC) middleware for sensitive routes.",
    cwe: "CWE-862",
    owasp: "A01:2021-Broken Access Control",
    enabled: true,
    testFixtures: {
      positive: ['if (user.role === null) allowAccess();'],
      negative: ['if (rbac.hasPermission(user, "read:admin")) allowAccess();']
    }
  },
  // 7. Environment Misconfiguration
  {
    id: "DEBUG_MODE_ENABLED",
    version: "1.0.0",
    category: "environment_misconfiguration",
    pattern: /debug\s*=\s*(?:true|1)|process\.env\.NODE_ENV\s*===\s*['"]development['"]/gi,
    severity: "Medium",
    confidence: 0.65,
    title: "Debug Mode or Environment Flag Leak",
    description: "Enabling detailed debug modes in production can leak system info, internal stack traces, and variables.",
    suggestion: "Ensure debug options are controlled strictly by node environments (process.env.NODE_ENV === 'production').",
    cwe: "CWE-215",
    owasp: "A05:2021-Security Misconfiguration",
    enabled: true,
    testFixtures: {
      positive: ['const debug = true;'],
      negative: ['const debug = process.env.NODE_ENV !== "production";']
    }
  },
  // 8. Sensitive Data Exposure
  {
    id: "UNSAFE_LOGGING",
    version: "1.0.0",
    category: "sensitive_data_exposure",
    pattern: /console\.(log|info|debug)\s*\(.*(?:password|secret|email|phone|ssn|token)/gi,
    severity: "High",
    confidence: 0.75,
    title: "Unsafe Logging of Sensitive Information",
    description: "Printing variables that hold secrets, credentials, or personal information (PII) exposes them in console logs.",
    suggestion: "Filter or sanitize variables before logging them, or use a secure logger that masks private data.",
    cwe: "CWE-532",
    owasp: "A09:2021-Security Logging and Monitoring Failures",
    enabled: true,
    testFixtures: {
      positive: ['console.log("User password is:", password);'],
      negative: ['logger.info("User authenticated successfully", { userId });']
    }
  },
  // 9. General Vulnerability
  {
    id: "EVAL_USAGE",
    version: "1.0.0",
    category: "general_vulnerability",
    pattern: /eval\s*\(/gi,
    severity: "Critical",
    confidence: 0.95,
    title: "Arbitrary Code Execution via eval()",
    description: "eval() executes any string passed to it, opening the door for complete system compromise.",
    suggestion: "Refactor code to use JSON.parse() or specific functional handlers.",
    cwe: "CWE-95",
    owasp: "A03:2021-Injection",
    enabled: true,
    testFixtures: {
      positive: ['const res = eval(input);'],
      negative: ['const res = JSON.parse(input);']
    }
  },
  {
    id: "SHELL_EXECUTION",
    version: "1.0.0",
    category: "general_vulnerability",
    pattern: /exec\s*\(\s*['"`]|child_process/gi,
    severity: "Critical",
    confidence: 0.85,
    title: "Command Injection via Process Spawn",
    description: "Invoking command shells dynamically can allow command injection attacks if arguments are raw user inputs.",
    suggestion: "Use safer alternatives like execFile() or validate and escape all inputs rigorously.",
    cwe: "CWE-78",
    owasp: "A03:2021-Injection",
    enabled: true,
    testFixtures: {
      positive: ['child_process.exec("ping " + host);'],
      negative: ['child_process.execFile("ping", [host]);']
    }
  },
  // 10. SSRF Risk
  {
    id: "SSRF_UNVALIDATED_REQUEST",
    version: "1.0.0",
    category: "ssrf",
    pattern: /(?:fetch|axios(?:\.get|\.post)?|request)\s*\(\s*(?:req\.(?:query|params|body)|url\b)/gi,
    severity: "High",
    confidence: 0.75,
    title: "Potential Server-Side Request Forgery (SSRF)",
    description: "Outgoing HTTP requests made using unvalidated user inputs can allow attackers to probe internal cloud metadata and private networks.",
    suggestion: "Validate destination URLs against an explicit domain allowlist and restrict requests to private IP ranges (127.0.0.1, 169.254.169.254).",
    cwe: "CWE-918",
    owasp: "A10:2021-Server-Side Request Forgery",
    enabled: true,
    testFixtures: {
      positive: ['await axios.get(req.query.targetUrl);'],
      negative: ['await axios.get("https://api.github.com/repos");']
    }
  },
  // 11. Path Traversal
  {
    id: "PATH_TRAVERSAL",
    version: "1.0.0",
    category: "path_traversal",
    pattern: /fs\.(?:readFile|readFileSync|createReadStream)\s*\(\s*(?:.*req\.(?:query|params|body)|path\.join\(.*req\.)/gi,
    severity: "Critical",
    confidence: 0.85,
    title: "Path Traversal File Read Vulnerability",
    description: "Reading files using user-supplied parameters without strict sanitization allows attackers to read sensitive system files (e.g. /etc/passwd).",
    suggestion: "Sanitize file paths with path.basename() or resolve paths against an isolated root directory.",
    cwe: "CWE-22",
    owasp: "A01:2021-Broken Access Control",
    enabled: true,
    testFixtures: {
      positive: ['fs.readFileSync(path.join("/uploads", req.query.file));'],
      negative: ['fs.readFileSync(path.join("/uploads", path.basename(req.query.file)));']
    }
  },
  // 12. Insecure CORS
  {
    id: "INSECURE_CORS_ORIGIN",
    version: "1.0.0",
    category: "security_misconfiguration",
    pattern: /res\.setHeader\s*\(\s*['"]Access-Control-Allow-Origin['"]\s*,\s*['"]\*['"]\)|cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]\s*,\s*credentials\s*:\s*true/gi,
    severity: "Medium",
    confidence: 0.8,
    title: "Overly Permissive CORS Configuration",
    description: "Allowing all origins (*) with credentials or sensitive API endpoints can expose authenticated sessions to cross-site data theft.",
    suggestion: "Specify explicit trusted origins in CORS configuration instead of wildcards.",
    cwe: "CWE-942",
    owasp: "A05:2021-Security Misconfiguration",
    enabled: true,
    testFixtures: {
      positive: ['cors({ origin: "*", credentials: true });'],
      negative: ['cors({ origin: ["https://app.example.com"], credentials: true });']
    }
  }
];

module.exports = defaultRules;
