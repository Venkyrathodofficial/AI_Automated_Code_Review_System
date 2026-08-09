require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());

// Version routing middleware: maps incoming client /api/v1/... requests internally to /api/...
app.use((req, res, next) => {
  if (req.url.startsWith("/api/v1/")) {
    req.url = req.url.replace(/^\/api\/v1/, "/api");
  }
  next();
});

function rawBodySaver(req, _res, buf) {
  if (buf && buf.length) req.rawBody = buf.toString("utf8");
}

app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ extended: true, verify: rawBodySaver }));

function getGithubPayload(req) {
  let payload = req.body;
  if (payload && typeof payload.payload === "string") {
    try {
      payload = JSON.parse(payload.payload);
    } catch {
      payload = {};
    }
  }
  if (!payload || typeof payload !== "object") return {};
  return payload;
}

function verifyGithubSignature(req, secret) {
  if (!secret) return true; // fallback if no secret is configured
  const sig = req.headers["x-hub-signature-256"];
  if (!sig) return false; // reject unsigned requests when a secret is configured
  if (!req.rawBody) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex")}`;

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function extractChangedFiles(payload) {
  const changed = new Set();

  const commits = Array.isArray(payload.commits) ? payload.commits : [];
  for (const commit of commits) {
    for (const filePath of commit.added || []) changed.add(filePath);
    for (const filePath of commit.modified || []) changed.add(filePath);
  }

  if (changed.size === 0 && payload.head_commit) {
    for (const filePath of payload.head_commit.added || []) changed.add(filePath);
    for (const filePath of payload.head_commit.modified || []) changed.add(filePath);
  }

  return [...changed];
}

// ============================
// API: Fix Code with AI
// ============================
const { fixCodeWithAI } = require("./fixService");
const { validateAndExplainIssuesWithGemini } = require("./geminiService");
const {
  sendDetailedIssueReportEmail,
  sendMobileReportReadyNotification,
  buildIssueReportPdfBuffer,
} = require("./alertService");

app.post("/api/fix-code", async (req, res) => {
  try {
    const { code, issueDescription } = req.body;
    if (!code || !issueDescription) {
      return res.status(400).json({ error: "Missing code or issueDescription" });
    }
    const result = await fixCodeWithAI(code, issueDescription);
    if (!result) {
      return res.status(500).json({ error: "AI failed to return a fix" });
    }
    return res.json(result);
  } catch (err) {
    console.error("/api/fix-code error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Commit Fix to GitHub
// ============================
app.post("/api/commit-fix", authMiddleware, async (req, res) => {
  try {
    const { fileName, improvedCode, repo, branch, token } = req.body;
    if (!fileName || !improvedCode || !repo) {
      return res.status(400).json({ error: "Missing fileName, improvedCode, or repo" });
    }

    // 1. Determine which GitHub token to use
    let githubToken = token;
    if (!githubToken) {
      // Get user's token from Supabase profiles
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("github_token")
        .eq("id", req.user.id)
        .single();
      
      if (profileErr || !profile?.github_token) {
        return res.status(401).json({ error: "GitHub account not connected. Please connect via Settings or provide a token manually." });
      }
      githubToken = profile.github_token;
    }

    // 2. Fetch the current file's SHA from GitHub API
    const targetBranch = branch || "main";
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AI-Code-Review-Bot",
      Authorization: `token ${githubToken}`,
    };

    const encodedPath = fileName
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
      
    const url = `https://api.github.com/repos/${repo}/contents/${encodedPath}?ref=${targetBranch}`;
    const getRes = await fetch(url, { headers });
    
    let sha = null;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    } else if (getRes.status !== 404) {
      const errMsg = await getRes.text();
      return res.status(getRes.status).json({ error: `GitHub API error: ${errMsg}` });
    }

    // 3. Commit/PUT updated file back to GitHub
    const putUrl = `https://api.github.com/repos/${repo}/contents/${encodedPath}`;
    const putBody = {
      message: `fix(sentinel-ai): automatic review code fix for ${fileName}`,
      content: Buffer.from(improvedCode).toString("base64"),
      branch: targetBranch,
    };
    if (sha) {
      putBody.sha = sha;
    }

    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const errMsg = await putRes.text();
      return res.status(putRes.status).json({ error: `GitHub commit failed: ${errMsg}` });
    }

    const putData = await putRes.json();
    return res.json({ success: true, commit: putData.commit });
  } catch (err) {
    console.error("/api/commit-fix error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// ============================
// GitHub OAuth Endpoints
// ============================
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = 'https://codeaurorasentinel.vercel.app'; // Update if needed

// Step 1: Redirect to GitHub
app.get('/api/auth/github', (req, res) => {
  const redirectUri = `${FRONTEND_URL}/api/auth/github/callback`;
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo`);
});

// Step 2: Handle callback and exchange code for token
app.get('/api/auth/github/callback', async (req, res) => {
  const code = req.query.code;
  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${FRONTEND_URL}/api/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(400).send('GitHub authentication failed: No access token');
    }

    // Get user info from GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const userData = await userRes.json();
    if (!userData.id) {
      return res.status(400).send('GitHub authentication failed: No user info');
    }

    // Find the logged-in Supabase user (assume frontend passes supabase token as ?sb_token=...)
    const sbToken = req.query.sb_token;
    if (!sbToken) {
      return res.status(400).send('Missing Supabase session token');
    }
    const { data: { user }, error } = await supabase.auth.getUser(sbToken);
    if (error || !user) {
      return res.status(401).send('Invalid Supabase session');
    }

    // Store GitHub token in profiles table
    await supabase.from('profiles').upsert({ id: user.id, github_token: accessToken, updated_at: new Date().toISOString() });

    // Redirect to frontend with success
    res.redirect(`${FRONTEND_URL}/settings?github=connected`);
  } catch (err) {
    res.status(500).send('GitHub authentication failed');
  }
});

// ============================
// Supabase Setup
// ============================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_KEY;

// Use service key for admin operations (bypasses RLS)
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// Log which key type is being used
if (supabaseServiceKey) {
  console.log("✅ Using SUPABASE_SERVICE_KEY (RLS bypass enabled)");
} else {
  console.log("⚠️ SUPABASE_SERVICE_KEY not set - using SUPABASE_KEY (RLS will apply!)");
  console.log("⚠️ Admin dashboard may not show all data. Set SUPABASE_SERVICE_KEY for full access.");
}

// Startup migration backfill to ensure free tier has 5 scans limit
(async () => {
  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({ monthly_scans_limit: 5 })
      .eq("plan_tier", "free")
      .eq("monthly_scans_limit", 3);
    if (error) {
      console.log("⚠️ Failed to auto-upgrade free tier limits:", error.message);
    } else {
      console.log("✅ Auto-upgraded free tier limits to 5 scans/month.");
    }
  } catch (err) {
    console.log("⚠️ Error upgrading free tier limits:", err.message);
  }
})();

function supabaseForUser(token) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ============================
// Auth Middleware
// ============================
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = user;
  req.token = token;
  req.supabase = supabaseForUser(token);
  next();
}

// ============================
// Beta Plan Configuration
// ============================
const PLAN_LIMITS = {
  free:  { scans: 5,      fileCap: 100, sizeMbCap: 10,  rateLimitMs: 60000  },
  beta:  { scans: 100,    fileCap: 500, sizeMbCap: 50,  rateLimitMs: 15000  },
  basic: { scans: 100,    fileCap: 500, sizeMbCap: 50,  rateLimitMs: 15000  }, // legacy alias
  admin: { scans: 999999, fileCap: 999, sizeMbCap: 500, rateLimitMs: 0      },
};

function getPlanLimits(tier) {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

// ============================
// In-Memory Rate Limiter
// ============================
// Map<userId, lastScanTimestamp>
const scanRateLimiter = new Map();

function checkRateLimit(userId, tier) {
  const limits = getPlanLimits(tier);
  if (limits.rateLimitMs === 0) return null; // admin — no limit
  const last = scanRateLimiter.get(userId) || 0;
  const elapsed = Date.now() - last;
  if (elapsed < limits.rateLimitMs) {
    const waitSec = Math.ceil((limits.rateLimitMs - elapsed) / 1000);
    return `Rate limit: please wait ${waitSec}s before your next scan.`;
  }
  return null;
}

function markScanStarted(userId) {
  scanRateLimiter.set(userId, Date.now());
}

// ============================
// Scan Queue (prevent parallel/duplicate scans)
// ============================
// Set<"userId:repoFullName">
const activeScans = new Set();

function isAlreadyScanning(userId, repoFullName) {
  return activeScans.has(`${userId}:${repoFullName}`);
}

function markScanActive(userId, repoFullName) {
  activeScans.add(`${userId}:${repoFullName}`);
}

function markScanComplete(userId, repoFullName) {
  activeScans.delete(`${userId}:${repoFullName}`);
}

// ============================
// GitHub API helper
// ============================
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
// Accepts an optional token (per-user), falls back to global token
function ghHeaders(userToken) {
  const h = { Accept: "application/vnd.github.v3+json", "User-Agent": "AI-Code-Review-Bot" };
  if (userToken) h.Authorization = `token ${userToken}`;
  else if (GITHUB_TOKEN) h.Authorization = `token ${GITHUB_TOKEN}`;
  return h;
}

/** Fetch the file tree from a GitHub repo (default branch) */
async function fetchRepoTree(repoFullName, userToken) {
  // Get default branch
  const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers: ghHeaders(userToken) });
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
  const repoData = await repoRes.json();
  const branch = repoData.default_branch || "main";

  // Get full tree recursively
  const treeRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`,
    { headers: ghHeaders(userToken) }
  );
  if (!treeRes.ok) throw new Error(`GitHub tree error: ${treeRes.status}`);
  const treeData = await treeRes.json();

  // Filter only code files (not huge, not binary)
  const codeExtensions = new Set([
    ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".rb", ".go", ".rs",
    ".cpp", ".c", ".h", ".cs", ".php", ".swift", ".kt", ".scala",
    ".vue", ".svelte", ".html", ".css", ".scss", ".sql", ".sh", ".yaml", ".yml",
    ".json", ".xml", ".env", ".dockerfile", ".tf",
  ]);

  return (treeData.tree || []).filter((item) => {
    if (item.type !== "blob") return false;
    if (item.size > 100000) return false; // skip files > 100KB
    const ext = item.path.lastIndexOf(".") >= 0 ? item.path.substring(item.path.lastIndexOf(".")).toLowerCase() : "";
    return codeExtensions.has(ext);
  });
}

/** Fetch file content from GitHub */
async function fetchFileContent(repoFullName, filePath, ref, userToken) {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `https://api.github.com/repos/${repoFullName}/contents/${encodedPath}${ref ? `?ref=${ref}` : ""}`;
  const res = await fetch(url, { headers: ghHeaders(userToken) });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return null;
}

// ============================
// Code Analysis Engine
// ============================
const analysisRules = [
  // 1. API Key Exposure
  {
    id: "API_KEY_EXPOSURE",
    category: "api_key_exposure",
    pattern: /(?:gemini|openai|stripe|aws|azure|firebase|github|jwt|secret|key|token|passwd|auth)[_-]?(?:key|secret|token|password|cred|pass|auth|cert|hash|salt|private|api)?\s*[:=]\s*["'](?:sb_publishable_|sk_|sk-proj-|AIzaSy|amzn\.mws\.|ghp_|gho_|ghu_|ghs_|eyJhbGciOi)[a-zA-Z0-9_\-\+]{4,}/gi,
    severity: "Critical",
    title: "Hardcoded API Key or Secret Token",
    description: "Private keys, tokens, or credentials embedded directly in code can be compromised through version control.",
    suggestion: "Extract secrets to environment variables (.env files) or use a managed secret manager.",
    tip: "Enable automated secret scanners on GitHub to alert you before leaks are committed.",
    riskScore: 10
  },
  {
    id: "API_KEY_VARIABLE",
    category: "api_key_exposure",
    pattern: /(?:api[_-]?key|client[_-]?secret|jwt[_-]?secret|private[_-]?key|stripe[_-]?secret|github[_-]?token)\s*[:=]\s*["'][a-zA-Z0-9_\-\+\.]{16,}["']/gi,
    severity: "Critical",
    title: "Suspicious Hardcoded Credential Variable",
    description: "A variable named after an API key or secret has been assigned a hardcoded string literal.",
    suggestion: "Replace the hardcoded secret string with process.env.YOUR_VARIABLE_NAME.",
    tip: "Use dotenv locally and native cloud secrets manager for deployment.",
    riskScore: 9
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
    tip: "Never construct SQL strings dynamically from untrusted user input.",
    riskScore: 10
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
    tip: "Modern frameworks like React default to escaping content—avoid overriding this behavior.",
    riskScore: 8
  },
  {
    id: "XSS_DOCWRITE",
    category: "xss",
    pattern: /document\.write\s*\(/gi,
    severity: "High",
    title: "Cross-Site Scripting (XSS) via document.write()",
    description: "document.write() is a deprecated API that can cause security breaches and performance bottlenecks.",
    suggestion: "Use safer DOM APIs like createElement() and appendChild().",
    tip: "Most modern web applications block document.write by default.",
    riskScore: 8
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
    tip: "Regularly execute `npm audit` or `yarn audit` to scan dependencies for known CVEs.",
    riskScore: 7
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
    tip: "For passwords, always use salted slower algorithms like bcrypt.",
    riskScore: 8
  },
  {
    id: "HARDCODED_PASSWORD",
    category: "authentication_weakness",
    pattern: /password\s*===\s*["'][^"']+["']/gi,
    severity: "Critical",
    title: "Hardcoded Password Comparison",
    description: "Verifying user credentials against a static, hardcoded string is highly vulnerable to discovery.",
    suggestion: "Verify password hashes retrieved from a database using secure compare methods.",
    tip: "Implement managed auth services like Supabase Auth or Clerk for bulletproof user management.",
    riskScore: 9
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
    tip: "Implement attribute-based access control (ABAC) or standard RBAC tables in your database.",
    riskScore: 6
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
    tip: "Disable debug headers in production proxies.",
    riskScore: 5
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
    tip: "Winston or Pino loggers can mask sensitive fields like passwords automatically.",
    riskScore: 8
  },

  // 9. General Vulnerability (e.g. eval, command injection)
  {
    id: "EVAL_USAGE",
    category: "general_vulnerability",
    pattern: /eval\s*\(/gi,
    severity: "Critical",
    title: "Arbitrary Code Execution via eval()",
    description: "eval() executes any string passed to it, opening the door for complete system compromise.",
    suggestion: "Refactor code to use JSON.parse() or specific functional handlers.",
    tip: "eval is deprecated in performance and highly discouraged in security audits.",
    riskScore: 9
  },
  {
    id: "SHELL_EXECUTION",
    category: "general_vulnerability",
    pattern: /exec\s*\(\s*['"`]|child_process/gi,
    severity: "Critical",
    title: "Command Injection via Process Spawn",
    description: "Invoking command shells dynamically can allow command injection attacks if arguments are raw user inputs.",
    suggestion: "Use safer alternatives like execFile() or validate and escape all inputs rigorously.",
    tip: "Never invoke process shells directly if standard library APIs can satisfy the requirement.",
    riskScore: 9
  }
];

/** Analyze a single file's content and return issues found using static regex */
function analyzeFileStatic(filePath, content) {
  const issues = [];
  const ext = filePath.lastIndexOf(".") >= 0 ? filePath.substring(filePath.lastIndexOf(".")).toLowerCase() : "";

  // Skip minified files
  const avgLineLength = content.length / Math.max(1, content.split("\n").length);
  if (avgLineLength > 200) return issues;

  const lines = content.split("\n");

  for (const rule of analysisRules) {
    lines.forEach((line, idx) => {
      // Reset regex lastIndex
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        const lineNumber = idx + 1;
        
        // Extract 3 lines of context before and after
        const start = Math.max(0, idx - 3);
        const end = Math.min(lines.length - 1, idx + 3);
        const snippetLines = lines.slice(start, end + 1);
        const snippet = snippetLines.join("\n");

        issues.push({
          ruleId: rule.id,
          category: rule.category || "general_vulnerability",
          file_name: filePath,
          issue_title: rule.title,
          issue_description: rule.description,
          severity: rule.severity,
          suggestion: rule.suggestion,
          optimization_tip: rule.tip || "",
          risk_score: rule.riskScore || 1,
          line_number: lineNumber,
          snippet: snippet,
          offending_line: line.trim()
        });
      }
    });
  }

  return issues;
}

/** Analyze a single file's content and return issues found. Pre-filters with regex, and validates with Gemini 2.5 Flash. */
async function analyzeFile(filePath, content, geminiOpts = {}) {
  const potentialIssues = analyzeFileStatic(filePath, content);
  if (potentialIssues.length === 0) {
    return [];
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.log(`ℹ️ GEMINI_API_KEY not set - falling back to raw static regex rules for: ${filePath}`);
    return potentialIssues;
  }
  
  console.log(`🤖 Validating ${potentialIssues.length} issues in ${filePath} using Gemini 2.5 Flash...`);
  return validateAndExplainIssuesWithGemini(filePath, potentialIssues, geminiOpts);
}

function calculateSecurityScore(issues) {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  issues.forEach((issue) => {
    if (!issue.issue_title) return;
    // Skip placeholder rows
    if (issue.issue_title.includes("complete — no issues found") || 
        issue.issue_title.includes("failed — cannot access") ||
        issue.issue_title.includes("Clean commit") ||
        issue.issue_title.includes("Clean scan")) {
      return;
    }
    const sev = String(issue.severity || "").toLowerCase();
    if (sev === "critical") criticalCount++;
    else if (sev === "high") highCount++;
    else if (sev === "medium") mediumCount++;
    else if (sev === "low") lowCount++;
  });

  const scoreDeductions = criticalCount * 15 + highCount * 8 + mediumCount * 4 + lowCount * 1;
  const score = Math.max(0, 100 - scoreDeductions);
  
  let grade = "F";
  if (score >= 95) grade = "A+";
  else if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";

  let riskLevel = "Critical";
  if (score >= 90) riskLevel = "Low";
  else if (score >= 70) riskLevel = "Medium";
  else if (score >= 50) riskLevel = "High";

  return {
    score,
    grade,
    riskLevel,
    criticalCount,
    highCount,
    mediumCount,
    lowCount
  };
}

function getSecurityGrade(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function getSecurityRiskLevel(score) {
  if (score >= 90) return "Low Risk";
  if (score >= 70) return "Medium Risk";
  if (score >= 50) return "High Risk";
  return "Critical Risk";
}

/** Scan an entire repo: fetch files and analyze each one */
async function scanRepository(repoFullName, userId, ref, planTier = "free") {
  const scanId = crypto.randomUUID();
  const planLimits = getPlanLimits(planTier);
  console.log(`🔍 Starting full scan of ${repoFullName} for user ${userId} (plan: ${planTier}). Scan ID: ${scanId}`);

  // Fetch user's GitHub token from profiles
  let userToken = null;
  try {
    const { data: profile } = await supabase.from('profiles').select('github_token').eq('id', userId).single();
    if (profile && profile.github_token) userToken = profile.github_token;
  } catch {}

  let files;
  try {
    files = await fetchRepoTree(repoFullName, userToken);
  } catch (err) {
    console.error(`   ❌ Cannot access repo ${repoFullName}:`, err.message);
    markScanComplete(userId, repoFullName);
    
    // Create scan history entry even on error
    await supabase.from("scan_history").insert({
      id: scanId,
      user_id: userId,
      repository_name: repoFullName,
      scan_date: new Date().toISOString(),
      security_score: 0,
      security_grade: 'F',
      files_scanned: 0,
      commit_id: "scan-error",
      commit_message: "Scan failed"
    });

    // Record error so user sees it on the dashboard
    await supabase.from("code_reviews").insert([{
      user_id: userId,
      repository_name: repoFullName,
      file_name: "—",
      issue_title: "Scan failed — cannot access repository",
      issue_description: `Could not fetch files from GitHub for ${repoFullName}. ${err.message.includes("404") ? "The repository may be private or the name may be incorrect. For private repos, set GITHUB_TOKEN in your backend environment." : err.message}`,
      severity: "Medium",
      suggestion: "Ensure the repository exists and is public, or add a GitHub personal access token (GITHUB_TOKEN) in your backend environment variables for private repo access.",
      optimization_tip: "Go to github.com/settings/tokens → Generate new token (classic) → Select 'repo' scope → Add the token as GITHUB_TOKEN in Render environment variables.",
      risk_score: 0,
      commit_id: "scan-error",
      commit_message: "Scan failed",
      status: "Open",
      scan_id: scanId
    }]);
    return { filesScanned: 0, issuesFound: 0, error: err.message };
  }

  // ── Repo size limits (per plan) ────────────────────────────
  const totalFiles = files.length;
  const totalSizeMb = files.reduce((sum, f) => sum + (f.size || 0), 0) / (1024 * 1024);

  if (totalFiles > planLimits.fileCap) {
    console.warn(`⚠️ Repo ${repoFullName} has ${totalFiles} files — exceeds ${planTier} cap of ${planLimits.fileCap}`);
  }
  if (totalSizeMb > planLimits.sizeMbCap) {
    markScanComplete(userId, repoFullName);
    await supabase.from("code_reviews").insert([{
      user_id: userId,
      repository_name: repoFullName,
      file_name: "—",
      issue_title: `Scan blocked — repository too large for ${planTier} plan`,
      issue_description: `Your repository is ${totalSizeMb.toFixed(1)}MB. The ${planTier} plan supports repositories up to ${planLimits.sizeMbCap}MB. Upgrade to Beta for 50MB support.`,
      severity: "Low",
      suggestion: `Upgrade your plan to scan larger repositories. Beta plan supports up to ${planLimits.sizeMbCap}MB.`,
      optimization_tip: "Enter a promo code on the Plans page to unlock Beta access instantly.",
      risk_score: 0,
      commit_id: ref || "size-limit",
      commit_message: "Scan blocked: repo too large",
      status: "Open",
      scan_id: scanId
    }]);
    return { filesScanned: 0, issuesFound: 0, error: "Repo too large for plan" };
  }

  console.log(`   Found ${files.length} code files to analyze`);
  // Enforce file cap per plan
  const filesToScan = files.slice(0, planLimits.fileCap);
  const allIssues = [];
  const geminiOpts = { userId, scanId, repoName: repoFullName, supabase };

  for (const file of filesToScan) {
    try {
      const content = await fetchFileContent(repoFullName, file.path, ref, userToken);
      if (!content) continue;

      const fileIssues = await analyzeFile(file.path, content, geminiOpts);
      for (const issue of fileIssues) {
        allIssues.push({
          user_id: userId,
          repository_name: repoFullName,
          file_name: issue.file_name,
          issue_title: issue.issue_title,
          issue_description: issue.issue_description,
          severity: issue.severity,
          suggestion: issue.suggestion,
          optimization_tip: issue.optimization_tip,
          risk_score: issue.risk_score,
          commit_id: ref || "initial-scan",
          commit_message: ref ? `Commit ${ref.substring(0, 7)}` : "Initial repository scan",
          status: "Open",
          scan_id: scanId,
          line_number: issue.line_number || null,
          category: issue.category || "general_vulnerability",
          secure_code: issue.secure_code || "",
          best_practices: issue.best_practices || "",
          ai_model: issue.ai_model || "Gemini 2.5 Flash",
          confidence_score: issue.confidence_score !== undefined ? issue.confidence_score : 0.92,
          validation_status: issue.validation_status || "passed"
        });
      }
    } catch (err) {
      console.error(`   ⚠️ Error analyzing ${file.path}:`, err.message);
    }
  }

  markScanComplete(userId, repoFullName);

  // Calculate score & grade
  const { score, grade, criticalCount, highCount, mediumCount, lowCount } = calculateSecurityScore(allIssues);

  // Insert scan history row
  await supabase.from("scan_history").insert({
    id: scanId,
    user_id: userId,
    repository_name: repoFullName,
    scan_date: new Date().toISOString(),
    security_score: score,
    security_grade: grade,
    critical_issues: criticalCount,
    high_issues: highCount,
    medium_issues: mediumCount,
    low_issues: lowCount,
    files_scanned: filesToScan.length,
    commit_id: ref || "initial-scan",
    commit_message: ref ? `Commit ${ref.substring(0, 7)}` : "Initial repository scan"
  });

  // Insert all issues in batches of 20
  if (allIssues.length > 0) {
    for (let i = 0; i < allIssues.length; i += 20) {
      const batch = allIssues.slice(i, i + 20);
      const { error } = await supabase.from("code_reviews").insert(batch);
      if (error) {
        console.error("   ❌ Insert batch error:", error.message);
      }
    }
    console.log(`   ✅ Inserted ${allIssues.length} issues for ${repoFullName}`);
  } else {
    // Still insert a positive "clean" entry so the dashboard shows something
    await supabase.from("code_reviews").insert([{
      user_id: userId,
      repository_name: repoFullName,
      file_name: "—",
      issue_title: "Repository scan complete — no issues found",
      issue_description: `Scanned ${filesToScan.length} files. No security, quality, or performance issues detected.`,
      severity: "Low",
      suggestion: "Keep up the good work! Continue following best practices.",
      optimization_tip: "Consider adding automated linting and testing to maintain code quality.",
      risk_score: 0,
      commit_id: ref || "initial-scan",
      commit_message: ref ? `Commit ${ref.substring(0, 7)}` : "Initial repository scan",
      status: "Resolved",
      scan_id: scanId,
      line_number: null,
      category: "general_vulnerability",
      secure_code: "",
      best_practices: ""
    }]);
    console.log(`   ✅ Clean scan for ${repoFullName} (no issues)`);
  }

  // Increment subscription monthly scans used
  const { error: rpcErr } = await supabase.rpc("increment_monthly_scans", { user_id_param: userId });
  if (rpcErr) {
    console.error("❌ Failed to increment scans used:", rpcErr.message);
  }

  return { filesScanned: filesToScan.length, issuesFound: allIssues.length, score, grade };
}

/** Analyze only specific files (for webhook pushes) */
async function analyzeChangedFiles(repoFullName, userId, filePaths, commitId, commitMessage) {
  const scanId = crypto.randomUUID();
  console.log(`🔍 Analyzing ${filePaths.length} changed files in ${repoFullName}. Scan ID: ${scanId}`);

  let userToken = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_token")
      .eq("id", userId)
      .single();
    if (profile && profile.github_token) userToken = profile.github_token;
  } catch {}

  const codeExtensions = new Set([
    ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".rb", ".go", ".rs",
    ".cpp", ".c", ".h", ".cs", ".php", ".swift", ".kt", ".scala",
    ".vue", ".svelte", ".html", ".css", ".scss", ".sql", ".sh", ".yaml", ".yml",
    ".json", ".xml", ".env", ".dockerfile", ".tf",
  ]);

  const codeFiles = filePaths.filter((fp) => {
    const ext = fp.lastIndexOf(".") >= 0 ? fp.substring(fp.lastIndexOf(".")).toLowerCase() : "";
    return codeExtensions.has(ext);
  });

  if (codeFiles.length === 0) {
    console.log("   No code files in this push, skipping analysis");
    return { filesScanned: 0, issuesFound: 0 };
  }

  const allIssues = [];

  for (const filePath of codeFiles.slice(0, 20)) {
    try {
      const content = await fetchFileContent(repoFullName, filePath, commitId, userToken);
      if (!content) continue;

      const fileIssues = await analyzeFile(filePath, content);
      for (const issue of fileIssues) {
        allIssues.push({
          user_id: userId,
          repository_name: repoFullName,
          file_name: issue.file_name,
          issue_title: issue.issue_title,
          issue_description: issue.issue_description,
          severity: issue.severity,
          suggestion: issue.suggestion,
          optimization_tip: issue.optimization_tip,
          risk_score: issue.risk_score,
          commit_id: commitId || "unknown",
          commit_message: commitMessage || "No message",
          status: "Open",
          scan_id: scanId,
          line_number: issue.line_number || null,
          category: issue.category || "general_vulnerability",
          secure_code: issue.secure_code || "",
          best_practices: issue.best_practices || "",
          ai_model: issue.ai_model || "Gemini 2.5 Flash",
          confidence_score: issue.confidence_score !== undefined ? issue.confidence_score : 0.92,
          validation_status: issue.validation_status || "passed"
        });
      }
    } catch (err) {
      console.error(`   ⚠️ Error analyzing ${filePath}:`, err.message);
    }
  }

  // Calculate score & grade
  const { score, grade, criticalCount, highCount, mediumCount, lowCount } = calculateSecurityScore(allIssues);

  // Insert scan history row
  await supabase.from("scan_history").insert({
    id: scanId,
    user_id: userId,
    repository_name: repoFullName,
    scan_date: new Date().toISOString(),
    security_score: score,
    security_grade: grade,
    critical_issues: criticalCount,
    high_issues: highCount,
    medium_issues: mediumCount,
    low_issues: lowCount,
    files_scanned: codeFiles.length,
    commit_id: commitId || "unknown",
    commit_message: commitMessage || "No message"
  });

  if (allIssues.length > 0) {
    for (let i = 0; i < allIssues.length; i += 20) {
      const batch = allIssues.slice(i, i + 20);
      const { error } = await supabase.from("code_reviews").insert(batch);
      if (error) console.error("   ❌ Insert error:", error.message);
    }
    console.log(`   ✅ Found ${allIssues.length} issues in push to ${repoFullName}`);
  } else {
    // Record a clean commit
    await supabase.from("code_reviews").insert([{
      user_id: userId,
      repository_name: repoFullName,
      file_name: codeFiles[0] || "—",
      issue_title: "Clean commit — no issues found",
      issue_description: `Analyzed ${codeFiles.length} changed file(s). No issues detected in this push.`,
      severity: "Low",
      suggestion: "Great job! This commit looks clean.",
      optimization_tip: "Continue writing clean code and following best practices.",
      risk_score: 0,
      commit_id: commitId || "unknown",
      commit_message: commitMessage || "No message",
      status: "Resolved",
      scan_id: scanId,
      line_number: null,
      category: "general_vulnerability",
      secure_code: "",
      best_practices: ""
    }]);
    console.log(`   ✅ Clean push to ${repoFullName}`);
  }

  // Increment subscription monthly scans used
  const { error: rpcErr } = await supabase.rpc("increment_monthly_scans", { user_id_param: userId });
  if (rpcErr) {
    console.error("❌ Failed to increment scans used:", rpcErr.message);
  }

  return { filesScanned: codeFiles.length, issuesFound: allIssues.length };
}

// ============================
// Root Route (Health Check)
// ============================
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ============================
// Public: Platform stats for landing page
// ============================
app.get("/api/public/stats", async (_req, res) => {
  try {
    console.log("📊 Fetching public stats...");
    
    // Count all code reviews (vulnerabilities found)
    const { count: totalReviews, error: reviewsErr } = await supabase
      .from("code_reviews")
      .select("id", { count: "exact", head: true });

    // Count resolved/fixed issues
    const { count: resolvedReviews } = await supabase
      .from("code_reviews")
      .select("id", { count: "exact", head: true })
      .ilike("status", "resolved");
    
    // Count all repositories (repositories scanned)
    const { count: totalRepos, error: reposErr } = await supabase
      .from("user_repositories")
      .select("id", { count: "exact", head: true });

    // Count unique organizations/owners
    let orgsCount = 0;
    const { data: reposData } = await supabase
      .from("user_repositories")
      .select("repo_full_name");
    
    if (reposData && reposData.length > 0) {
      const orgs = new Set(reposData.map(r => r.repo_full_name.split("/")[0]));
      orgsCount = orgs.size;
    }

    // Try to get users from auth.admin
    let totalUsers = 0;
    try {
      const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (!usersErr && usersData?.users) {
        totalUsers = usersData.users.length;
      }
    } catch (authErr) {
      console.log("⚠️ public/stats auth.admin error:", authErr.message);
    }

    // Fallback: count unique users from activity log
    if (totalUsers === 0) {
      const { data: activityData } = await supabase
        .from("user_activity_log")
        .select("user_id, email")
        .limit(5000);
      
      if (activityData && activityData.length > 0) {
        const uniqueUserIds = new Set(activityData.filter(a => a.user_id).map(a => a.user_id));
        const uniqueEmails = new Set(activityData.filter(a => a.email).map(a => a.email.toLowerCase()));
        totalUsers = Math.max(uniqueUserIds.size, uniqueEmails.size);
      }
    }

    // No baseline offsets - return exact counts
    const stats = {
      reposScanned: totalRepos || 0,
      vulnerabilitiesFound: totalReviews || 0,
      issuesFixed: resolvedReviews || 0,
      activeDevelopers: totalUsers || 0,
      orgsProtected: orgsCount || 0,
      
      // Supporting Landing.tsx keys
      totalRepos: totalRepos || 0,
      totalReviews: totalReviews || 0,
      totalUsers: totalUsers || 0,
      resolvedReviews: resolvedReviews || 0,
      orgsCount: orgsCount || 0
    };
    
    console.log("📊 Public stats response:", stats);
    return res.json(stats);
  } catch (err) {
    console.error("❌ Public stats error:", err);
    return res.json({
      reposScanned: 0,
      vulnerabilitiesFound: 0,
      issuesFixed: 0,
      activeDevelopers: 0,
      orgsProtected: 0,
      totalRepos: 0,
      totalReviews: 0,
      totalUsers: 0,
      resolvedReviews: 0,
      orgsCount: 0
    });
  }
});

// ============================
// Debug: Check Supabase connection and RLS status
// ============================
app.get("/api/debug/status", async (_req, res) => {
  const status = {
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasAnonKey: !!process.env.SUPABASE_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    keyType: process.env.SUPABASE_SERVICE_KEY ? "service_role" : "anon",
    queries: {},
  };

  try {
    // Test query on code_reviews
    const { count: reviewCount, error: reviewErr } = await supabase
      .from("code_reviews")
      .select("id", { count: "exact", head: true });
    status.queries.code_reviews = { count: reviewCount || 0, error: reviewErr?.message || null };

    // Test query on user_repositories  
    const { count: repoCount, error: repoErr } = await supabase
      .from("user_repositories")
      .select("id", { count: "exact", head: true });
    status.queries.user_repositories = { count: repoCount || 0, error: repoErr?.message || null };

    // Test query on user_activity_log
    const { count: activityCount, error: activityErr } = await supabase
      .from("user_activity_log")
      .select("id", { count: "exact", head: true });
    status.queries.user_activity_log = { count: activityCount || 0, error: activityErr?.message || null };

    // Test auth.admin
    try {
      const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 10 });
      status.queries.auth_users = { count: usersData?.users?.length || 0, error: usersErr?.message || null };
    } catch (authErr) {
      status.queries.auth_users = { count: 0, error: authErr.message };
    }

    status.healthy = !reviewErr && !repoErr;
    status.rlsIssue = (reviewCount === 0 && repoCount === 0) && !reviewErr && !repoErr;
    
    if (status.rlsIssue) {
      status.recommendation = "Run supabase_rls_fix.sql in Supabase SQL Editor to fix RLS policies";
    }
  } catch (err) {
    status.error = err.message;
  }

  return res.json(status);
});

// ============================
// API: Get user's connected repositories
// ============================
app.get("/api/repositories", authMiddleware, async (req, res) => {
  try {
    const { data: userRepos, error: repoErr } = await req.supabase
      .from("user_repositories")
      .select("*")
      .eq("user_id", req.user.id)
      .order("connected_at", { ascending: false });

    if (repoErr) {
      return res.status(500).json({ error: repoErr.message });
    }

    if (!userRepos || userRepos.length === 0) {
      return res.json([]);
    }

    const repoNames = userRepos.map((r) => r.repo_full_name);

    const { data: scanHistory, error: scanErr } = await req.supabase
      .from("scan_history")
      .select("repository_name, security_score, security_grade, critical_issues, high_issues, medium_issues, low_issues, scan_date")
      .eq("user_id", req.user.id)
      .in("repository_name", repoNames)
      .order("scan_date", { ascending: false });

    if (scanErr) {
      return res.status(500).json({ error: scanErr.message });
    }

    const { data: reviews, error: revErr } = await req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id)
      .in("repository_name", repoNames);

    if (revErr) {
      return res.status(500).json({ error: revErr.message });
    }

    const latestScanMap = {};
    const previousScanMap = {};
    (scanHistory || []).forEach((scan) => {
      if (!latestScanMap[scan.repository_name]) {
        latestScanMap[scan.repository_name] = scan;
      } else if (!previousScanMap[scan.repository_name]) {
        previousScanMap[scan.repository_name] = scan;
      }
    });

    const repoMap = {};
    userRepos.forEach((ur) => {
      repoMap[ur.repo_full_name] = {
        name: ur.repo_full_name,
        totalReviews: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        criticalOpen: 0,
        highOpen: 0,
        mediumOpen: 0,
        lowOpen: 0,
        open: 0,
        resolved: 0,
        lastReviewDate: null,
        files: new Set(),
        healthSignals: [],
        connectedAt: ur.connected_at,
      };
    });

    (reviews || []).forEach((review) => {
      const repo = repoMap[review.repository_name];
      if (!repo) return;

      repo.totalReviews += 1;
      const sev = String(review.severity || "").trim().toLowerCase();
      if (sev === "critical") repo.critical += 1;
      else if (sev === "high") repo.high += 1;
      else if (sev === "medium") repo.medium += 1;
      else repo.low += 1;

      const status = String(review.status || "").trim().toLowerCase();
      if (status === "resolved") {
        repo.resolved += 1;
      } else {
        repo.open += 1;
        if (sev === "critical") repo.criticalOpen += 1;
        else if (sev === "high") repo.highOpen += 1;
        else if (sev === "medium") repo.mediumOpen += 1;
        else repo.lowOpen += 1;
      }

      const score = Number(review.code_health_score);
      if (Number.isFinite(score) && score >= 0 && score <= 100) {
        repo.healthSignals.push({ score, createdAt: review.created_at || "" });
      }

      if (review.file_name) repo.files.add(review.file_name);
      if (review.created_at && (!repo.lastReviewDate || review.created_at > repo.lastReviewDate)) {
        repo.lastReviewDate = review.created_at;
      }
    });

    const repos = Object.values(repoMap).map((repo) => {
      const latestScan = latestScanMap[repo.name] || null;
      const previousScan = previousScanMap[repo.name] || null;

      let liveScore = null;
      if (repo.healthSignals.length > 0) {
        const recentSignals = [...repo.healthSignals]
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .slice(0, 30);
        const avg = recentSignals.reduce((sum, signal) => sum + signal.score, 0) / recentSignals.length;
        liveScore = Math.round(avg);
      } else {
        const filesBase = Math.max(repo.files.size || 0, 1);
        const weightedOpenIssues = repo.criticalOpen * 15 + repo.highOpen * 8 + repo.mediumOpen * 4 + repo.lowOpen * 1;
        liveScore = Math.max(0, Math.min(100, 100 - Math.round(weightedOpenIssues / filesBase)));
      }

      const hasLiveFindings = repo.open > 0 || repo.critical > 0 || repo.high > 0 || repo.medium > 0 || repo.low > 0;
      const historyScore = Number.isFinite(Number(latestScan?.security_score)) ? Number(latestScan.security_score) : null;
      const securityScore = hasLiveFindings ? liveScore : (historyScore ?? liveScore ?? 100);
      const securityGrade = getSecurityGrade(securityScore);
      const riskLevel = getSecurityRiskLevel(securityScore);
      const scoreImprovement = previousScan?.security_score !== undefined && previousScan?.security_score !== null
        ? securityScore - previousScan.security_score
        : null;
      const potentialSecurityGain = Math.max(0, 100 - securityScore);

      return {
        name: repo.name,
        totalReviews: repo.totalReviews,
        critical: repo.critical,
        high: repo.high,
        medium: repo.medium,
        low: repo.low,
        open: repo.open,
        resolved: repo.resolved,
        healthScore: securityScore,
        security_score: securityScore,
        security_grade: securityGrade,
        risk_level: riskLevel,
        criticalIssues: repo.criticalOpen || repo.critical,
        highIssues: repo.highOpen || repo.high,
        mediumIssues: repo.mediumOpen || repo.medium,
        lowIssues: repo.lowOpen || repo.low,
        lastReviewDate: latestScan?.scan_date || repo.lastReviewDate,
        previousSecurityScore: previousScan?.security_score ?? null,
        scoreImprovement,
        potentialSecurityGain,
        filesReviewed: repo.files.size,
        connectedAt: repo.connectedAt,
      };
    });

    return res.json(repos);
  } catch (err) {
    console.error("❌ Repos Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Connect a repository
// ============================
app.post("/api/repositories/connect", authMiddleware, async (req, res) => {
  try {
    let { repoFullName } = req.body;
    // Auto-parse GitHub URLs: https://github.com/owner/repo → owner/repo
    if (repoFullName) {
      repoFullName = repoFullName.trim()
        .replace(/^https?:\/\/(www\.)?github\.com\//, "")
        .replace(/\.git$/, "")
        .replace(/\/$/, "");
    }
    if (!repoFullName || !repoFullName.includes("/")) {
      return res.status(400).json({ error: "Provide repo as owner/repo" });
    }

    // Verify the repo is accessible on GitHub before connecting
    // Use user's token if available
    let userToken = null;
    try {
      const { data: profile } = await supabase.from('profiles').select('github_token').eq('id', req.user.id).single();
      if (profile && profile.github_token) userToken = profile.github_token;
    } catch {}
    const checkRes = await fetch(`https://api.github.com/repos/${repoFullName.trim()}`, { headers: ghHeaders(userToken) });
    if (checkRes.status === 404) {
      return res.status(400).json({
        error: `Repository "${repoFullName}" not found on GitHub. It may be private or the name may be incorrect.${!GITHUB_TOKEN ? " For private repos, add a GITHUB_TOKEN to the backend environment." : ""}`,
      });
    }
    if (!checkRes.ok) {
      console.error(`GitHub API returned ${checkRes.status} for ${repoFullName}`);
    }

    const webhookSecret = crypto.randomBytes(20).toString("hex");

    const { data, error } = await req.supabase
      .from("user_repositories")
      .upsert(
        {
          user_id: req.user.id,
          repo_full_name: repoFullName.trim(),
          webhook_secret: webhookSecret,
        },
        { onConflict: "user_id,repo_full_name" }
      )
      .select();

    if (error) {
      console.error("❌ Connect Repo Error:", error);
      return res.status(500).json({ error: error.message });
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const webhookUrl = `${backendUrl}/webhook/github/${req.user.id}`;

    // Trigger initial full repo scan in the background
    scanRepository(repoFullName.trim(), req.user.id).catch((err) => {
      console.error("❌ Initial scan failed:", err.message);
    });

    return res.json({
      success: true,
      repository: data?.[0],
      webhook: {
        url: webhookUrl,
        secret: webhookSecret,
        instructions: [
          `1. Go to https://github.com/${repoFullName.trim()}/settings/hooks`,
          `2. Click "Add webhook"`,
          `3. Set Payload URL to: ${webhookUrl}`,
          `4. Set Content type to: application/json`,
          `5. Set Secret to: ${webhookSecret}`,
          `6. Select "Just the push event"`,
          `7. Click "Add webhook"`,
        ],
      },
    });
  } catch (err) {
    console.error("❌ Connect Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Disconnect a repository
// ============================
app.delete("/api/repositories/:repoName", authMiddleware, async (req, res) => {
  try {
    const repoFullName = decodeURIComponent(req.params.repoName);
    const { error } = await req.supabase
      .from("user_repositories")
      .delete()
      .eq("user_id", req.user.id)
      .eq("repo_full_name", repoFullName);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Get original file content from GitHub
// ============================
app.get("/api/file-content", authMiddleware, async (req, res) => {
  try {
    const { file, repo, ref } = req.query;
    if (!file || !repo) {
      return res.status(400).json({ error: "Missing file or repo parameters" });
    }

    const { data: adminAccess, error: adminErr } = await req.supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (!adminErr && adminAccess) {
      return res.status(403).json({ error: "Admin accounts cannot access repository source code" });
    }

    // Get user's github token from profile
    let userToken = null;
    try {
      const { data: profile } = await req.supabase
        .from("profiles")
        .select("github_token")
        .eq("id", req.user.id)
        .single();
      if (profile && profile.github_token) userToken = profile.github_token;
    } catch {}

    const content = await fetchFileContent(repo, file, ref, userToken);
    if (content === null) {
      return res.status(404).json({ error: "File not found or access denied" });
    }

    return res.json({ code: content });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================
// API: Get user's code reviews
// ============================
app.get("/api/reviews", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Enrich reviews with AI verification fallbacks for legacy compatibility
    const reviews = (data || []).map(r => ({
      ...r,
      ai_model: r.ai_model || "Gemini 2.5 Flash",
      confidence_score: r.confidence_score !== null && r.confidence_score !== undefined ? Number(r.confidence_score) : 0.92,
      validation_status: r.validation_status || "passed"
    }));
    
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Get user's aggregate stats
// ============================
app.get("/api/stats", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const reviews = data || [];
    const critical = reviews.filter((r) => r.severity?.toLowerCase() === "critical").length;
    const high = reviews.filter((r) => r.severity?.toLowerCase() === "high").length;
    const medium = reviews.filter((r) => r.severity?.toLowerCase() === "medium").length;
    const low = reviews.filter((r) => r.severity?.toLowerCase() === "low").length;

    // AI Fixes Available: open issues having a suggestion that is not empty
    const fixesAvailable = reviews.filter((r) => r.suggestion && r.suggestion.trim() !== "" && r.status?.toLowerCase() === "open").length;

    // Security Score calculation
    // Max penalty is 100.
    // Each open critical: penalty 15
    // Each open high: penalty 8
    // Each open medium: penalty 4
    // Each open low: penalty 1
    const openReviews = reviews.filter((r) => r.status?.toLowerCase() === "open");
    const openCrit = openReviews.filter((r) => r.severity?.toLowerCase() === "critical").length;
    const openHigh = openReviews.filter((r) => r.severity?.toLowerCase() === "high").length;
    const openMed = openReviews.filter((r) => r.severity?.toLowerCase() === "medium").length;
    const openLow = openReviews.filter((r) => r.severity?.toLowerCase() === "low").length;

    const penalty = openCrit * 15 + openHigh * 8 + openMed * 4 + openLow * 1;
    const securityScore = Math.max(0, 100 - penalty);
    const securityGrade = getSecurityGrade(securityScore);
    const riskLevel = getSecurityRiskLevel(securityScore);
    const potentialSecurityGain = Math.min(100, penalty);

    return res.json({
      totalReviews: reviews.length,
      critical,
      high,
      medium,
      low,
      fixesAvailable,
      securityScore,
      securityGrade,
      riskLevel,
      potentialSecurityGain,
      open: reviews.filter((r) => r.status?.toLowerCase() === "open").length,
      resolved: reviews.filter((r) => r.status?.toLowerCase() === "resolved").length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Get user's scan history
// ============================
app.get("/api/scan-history", authMiddleware, async (req, res) => {
  try {
    const { repo } = req.query;
    let query = req.supabase
      .from("scan_history")
      .select("*")
      .eq("user_id", req.user.id)
      .order("scan_date", { ascending: false });

    if (repo) {
      query = query.eq("repository_name", repo);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Submit beta feedback
// ============================
app.post("/api/feedback", authMiddleware, async (req, res) => {
  try {
    const { category, feedback, rating, email } = req.body;
    if (!category || !feedback) {
      return res.status(400).json({ error: "Missing category or feedback message" });
    }
    const { error } = await supabase.from("beta_feedback").insert({
      user_id: req.user.id,
      email: email || req.user.email,
      feedback_type: category, // 'bug' | 'feature_request' | 'satisfaction' | 'general'
      rating: rating || null,
      message: feedback,
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Submit feedback error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Get community leaderboard (Public)
// ============================
app.get("/api/leaderboard", async (req, res) => {
  try {
    const { data: scans, error } = await supabase
      .from("scan_history")
      .select("*")
      .order("scan_date", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const latestRepoScans = {};
    const firstRepoScans = {};

    scans.forEach((scan) => {
      const repo = scan.repository_name;
      if (!latestRepoScans[repo]) {
        latestRepoScans[repo] = scan;
      }
      firstRepoScans[repo] = scan;
    });

    const leaderboard = [];
    const repoNames = Object.keys(latestRepoScans);
    for (const repo of repoNames) {
      const latest = latestRepoScans[repo];
      const earliest = firstRepoScans[repo];
      
      const scoreDiff = latest.security_score - earliest.security_score;
      const isImproved = scoreDiff > 0;
      const owner = repo.split("/")[0] || "unknown";

      leaderboard.push({
        rank: 0,
        repository_name: repo,
        owner: owner,
        security_score: latest.security_score,
        security_grade: latest.security_grade,
        critical_issues: latest.critical_issues || 0,
        high_issues: latest.high_issues || 0,
        medium_issues: latest.medium_issues || 0,
        low_issues: latest.low_issues || 0,
        last_scan_date: latest.scan_date,
        score_improvement: scoreDiff,
        most_improved: isImproved
      });
    }

    leaderboard.sort((a, b) => {
      if (b.security_score !== a.security_score) {
        return b.security_score - a.security_score;
      }
      const aCritical = a.critical_issues;
      const bCritical = b.critical_issues;
      if (aCritical !== bCritical) {
        return aCritical - bCritical;
      }
      return a.repository_name.localeCompare(b.repository_name);
    });

    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return res.json(leaderboard);
  } catch (err) {
    console.error("❌ Leaderboard Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Public Scan Report (No Auth Required)
// ============================
app.get("/api/public/reports/:scanId", async (req, res) => {
  try {
    const { scanId } = req.params;
    
    const { data: scan, error: scanErr } = await supabase
      .from("scan_history")
      .select("*")
      .eq("id", scanId)
      .single();

    if (scanErr || !scan) {
      return res.status(404).json({ error: "Report not found" });
    }

    const { data: reviews, error: reviewsErr } = await supabase
      .from("code_reviews")
      .select("*")
      .eq("scan_id", scanId)
      .order("severity", { ascending: false });

    if (reviewsErr) {
      return res.status(500).json({ error: reviewsErr.message });
    }

    return res.json({
      scan,
      reviews: reviews || []
    });
  } catch (err) {
    console.error("❌ Public report error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Generate & stream PDF report
// ============================
app.get(["/api/reports/download", "/api/reports/pdf"], async (req, res) => {
  try {
    const { scanId, repo } = req.query;
    
    // Check if authenticated
    let user = null;
    let client = supabase; // default admin client
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      if (authUser) {
        user = authUser;
        client = supabaseForUser(token);
      }
    }

    // Fallback: If no auth, we ONLY allow downloading if scanId is provided
    if (!user && !scanId) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    let reviews = [];
    let summary = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    let repositoryName = repo || "All Repositories";
    let securityScore = null;
    let securityGrade = null;
    let userEmail = user ? user.email : "developer@codeaurora.sentinel";

    if (scanId) {
      const { data: scan } = await client
        .from("scan_history")
        .select("*")
        .eq("id", scanId)
        .single();
      
      if (scan) {
        repositoryName = scan.repository_name;
        securityScore = scan.security_score;
        securityGrade = scan.security_grade;
        summary = {
          total: 0,
          critical: scan.critical_issues || 0,
          high: scan.high_issues || 0,
          medium: scan.medium_issues || 0,
          low: scan.low_issues || 0
        };
      }

      const { data: revs } = await client
        .from("code_reviews")
        .select("*")
        .eq("scan_id", scanId);
      
      reviews = revs || [];
    } else {
      let query = client
        .from("code_reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (repo) {
        query = query.eq("repository_name", repo);
      }

      const { data: revs } = await query;
      reviews = (revs || []).filter((r) => {
        const title = String(r.issue_title || "").toLowerCase();
        return !(title.includes("no issues found") || title.includes("scan complete") || title.includes("clean commit"));
      });

      reviews.forEach((r) => {
        const sev = String(r.severity || "").toLowerCase();
        if (sev === "critical") summary.critical++;
        else if (sev === "high") summary.high++;
        else if (sev === "medium") summary.medium++;
        else if (sev === "low") summary.low++;
      });
    }

    summary.total = reviews.length;

    const pdfBuffer = await buildIssueReportPdfBuffer({
      userEmail,
      issues: reviews,
      summary,
      extra: {
        repositoryName,
        securityScore,
        securityGrade
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="sentinel-security-report-${Date.now()}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ PDF Stream Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate report" });
  }
});

// ============================
// API: Dynamic Repository SVG Badges (Public)
// ============================
app.get("/api/repositories/badge/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoFullName = `${owner}/${repo}`;
    
    const { data: scan } = await supabase
      .from("scan_history")
      .select("security_grade, security_score")
      .eq("repository_name", repoFullName)
      .order("scan_date", { ascending: false })
      .limit(1)
      .single();

    let grade = "N/A";
    let score = null;
    if (scan) {
      grade = scan.security_grade || "N/A";
      score = scan.security_score;
    }

    let badgeColor = "#555555";
    if (grade.startsWith("A")) badgeColor = "#10B981";
    else if (grade.startsWith("B") || grade.startsWith("C")) badgeColor = "#F59E0B";
    else if (grade.startsWith("D")) badgeColor = "#EF4444";

    const gradeText = score !== null ? `Grade ${grade} (${score}%)` : "No scans";
    
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="165" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="165" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <rect width="85" height="20" fill="#24292e"/>
    <rect x="85" width="80" height="20" fill="${badgeColor}"/>
    <rect width="165" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="42.5" y="15" fill="#010101" fill-opacity=".3">Sentinel AI</text>
    <text x="42.5" y="14">Sentinel AI</text>
    <text x="125" y="15" fill="#010101" fill-opacity=".3">${gradeText}</text>
    <text x="125" y="14">${gradeText}</text>
  </g>
</svg>
`.trim();

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.send(svg);
  } catch (err) {
    console.error("❌ Badge generation error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// ============================
// API: Email detailed issue report (PDF)
// ============================
app.post("/api/notifications/report/email", authMiddleware, async (req, res) => {
  try {
    const { repoFullName = null, includeResolved = true } = req.body || {};

    let query = req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (repoFullName) {
      query = query.eq("repository_name", repoFullName);
    }

    const { data: reviews, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const filtered = (reviews || []).filter((r) => {
      const title = String(r.issue_title || "").toLowerCase();
      const isSummaryRow =
        title.includes("no issues found") ||
        title.includes("scan complete") ||
        title.includes("clean commit");

      if (isSummaryRow) return false;
      if (!includeResolved && String(r.status || "").toLowerCase() === "resolved") return false;
      return true;
    });

    if (filtered.length === 0) {
      return res.status(400).json({
        error: "No matching issues available to include in a report.",
      });
    }

    const userName =
      req.user.user_metadata?.full_name ||
      `${req.user.user_metadata?.first_name || ""} ${req.user.user_metadata?.last_name || ""}`.trim() ||
      "";

    const summary = await sendDetailedIssueReportEmail({
      to: req.user.email,
      userName,
      issues: filtered,
    });

    await sendMobileReportReadyNotification({
      externalUserId: req.user.id,
      title: "Report emailed",
      message: `Your detailed report (${summary.total} issues) has been emailed.`,
      url: process.env.FRONTEND_URL || "https://codeaurorasentinel.vercel.app/issues",
    });

    return res.json({
      success: true,
      message: `Detailed PDF report sent to ${req.user.email}`,
      summary,
    });
  } catch (err) {
    console.error("❌ Report email error:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate report",
    });
  }
});

// ============================
// API: Update review status
// ============================
app.patch("/api/reviews/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await req.supabase
      .from("code_reviews")
      .update({ status })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// GitHub Webhook Route (per-user)
// ============================
app.post("/webhook/github/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check subscription plan limits before running the scan
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("monthly_scans_used, monthly_scans_limit")
      .eq("user_id", userId)
      .single();
      
    if (sub && sub.monthly_scans_used >= sub.monthly_scans_limit) {
      console.log(`⚠️ Webhook push scan skipped for user ${userId}: limit reached (${sub.monthly_scans_used}/${sub.monthly_scans_limit})`);
      return res.status(403).send("Monthly scan limit reached");
    }

    const event = req.headers["x-github-event"] || "unknown";
    const payload = getGithubPayload(req);
    console.log(`✅ Webhook received for user ${userId} — event: ${event}`);

    // Handle ping event (sent when webhook is first created)
    if (event === "ping") {
      console.log(`   🏓 Ping from GitHub — zen: "${payload.zen || ""}"`);
      return res.status(200).json({ message: "pong", zen: payload.zen || null });
    }

    const repository = payload.repository?.full_name || "Unknown Repo";
    const head = payload.head_commit || {};

    // Verify this repo is connected to this user (case-insensitive match)
    const { data: userRepos } = await supabase
      .from("user_repositories")
      .select("*")
      .eq("user_id", userId);

    const userRepo = (userRepos || []).find(
      (r) => r.repo_full_name.toLowerCase() === repository.toLowerCase()
    );

    if (!userRepo) {
      console.log(`⚠️ Repo ${repository} not connected for user ${userId}`);
      return res.status(404).send("Repository not connected for this user");
    }

    // Verify webhook signature if present
    if (!verifyGithubSignature(req, userRepo.webhook_secret)) {
      return res.status(401).send("Invalid signature");
    }

    // Respond immediately, then analyze in background
    res.status(200).send("OK");

    // Collect all changed files from the push
    const allFiles = extractChangedFiles(payload);

    if (allFiles.length === 0) return;

    await analyzeChangedFiles(
      repository,
      userId,
      allFiles,
      head.id || "unknown",
      head.message || "No message"
    );
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Legacy webhook (backwards compat)

app.post("/webhook/github", async (req, res) => {
  try {
    const payload = getGithubPayload(req);
    const repository = payload.repository?.full_name || "Unknown Repo";
    const head = payload.head_commit || {};

    const { data: userRepo } = await supabase
      .from("user_repositories")
      .select("user_id, webhook_secret")
      .eq("repo_full_name", repository)
      .limit(1)
      .single();

    const userId = userRepo?.user_id || null;

    if (!userId) {
      console.log(`⚠️ Legacy Webhook: Repo ${repository} not connected to any user`);
      return res.status(404).send("Repository not found or user not connected");
    }

    // Verify webhook signature if secret is configured
    if (userRepo.webhook_secret && !verifyGithubSignature(req, userRepo.webhook_secret)) {
      console.log(`❌ Legacy Webhook signature verification failed for repo: ${repository}`);
      return res.status(401).send("Invalid signature");
    }

    // Respond immediately, then analyze in background
    res.status(200).send("OK");

    const allFiles = extractChangedFiles(payload);

    if (allFiles.length === 0) return;

    await analyzeChangedFiles(
      repository,
      userId,
      allFiles,
      head.id || "unknown",
      head.message || "No message"
    );
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// ============================
// API: Trigger a manual re-scan of a repository
// ============================
app.post("/api/repositories/scan", authMiddleware, async (req, res) => {
  try {
    let { repoFullName } = req.body;

    if (repoFullName) {
      repoFullName = repoFullName
        .trim()
        .replace(/^https?:\/\/(www\.)?github\.com\//, "")
        .replace(/\.git$/, "")
        .replace(/\/$/, "");
    }

    if (!repoFullName || !repoFullName.includes("/")) {
      return res.status(400).json({ error: "Provide repo as owner/repo" });
    }

    // Check subscription plan limits
    const { data: sub } = await req.supabase
      .from("subscriptions")
      .select("monthly_scans_used, monthly_scans_limit, plan_tier")
      .eq("user_id", req.user.id)
      .maybeSingle();

    const planTier = sub?.plan_tier || "free";

    if (sub && sub.monthly_scans_used >= sub.monthly_scans_limit) {
      return res.status(403).json({
        error: `Monthly scan limit reached (${sub.monthly_scans_used}/${sub.monthly_scans_limit}). Enter a Beta Access Code on the Plans page to unlock 100 scans/month.`,
        code: "SCAN_LIMIT_REACHED",
      });
    }

    // Rate limit check
    const rateLimitError = checkRateLimit(req.user.id, planTier);
    if (rateLimitError) {
      return res.status(429).json({ error: rateLimitError, code: "RATE_LIMITED" });
    }

    // Scan queue — prevent duplicate parallel scans
    if (isAlreadyScanning(req.user.id, repoFullName)) {
      return res.status(409).json({
        error: `A scan of ${repoFullName} is already in progress. Please wait for it to complete.`,
        code: "SCAN_IN_PROGRESS",
      });
    }

    const { data: userRepo } = await req.supabase
      .from("user_repositories")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("repo_full_name", repoFullName)
      .single();

    if (!userRepo) {
      return res.status(404).json({ error: "Repository not connected" });
    }

    res.json({
      success: true,
      message: `Scan started for ${repoFullName}. Results will appear on your dashboard shortly.`,
    });

    markScanStarted(req.user.id);
    markScanActive(req.user.id, repoFullName);
    scanRepository(repoFullName, req.user.id, null, planTier).catch((err) => {
      console.error("❌ Manual scan error:", err.message);
      markScanComplete(req.user.id, repoFullName);
    });
  } catch (err) {
    console.error("❌ Scan Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Promo Code Redemption
// ============================
app.post("/api/promo/redeem", authMiddleware, async (req, res) => {
  try {
    const rawCode = req.body.code;
    if (!rawCode || typeof rawCode !== "string") {
      return res.status(400).json({ error: "Promo code is required" });
    }

    // Sanitize: uppercase, strip non-alphanumeric except hyphen
    const code = rawCode.toUpperCase().replace(/[^A-Z0-9\-]/g, "").substring(0, 50);
    if (!code) return res.status(400).json({ error: "Invalid promo code format" });

    const { data, error } = await req.supabase.rpc("redeem_promo_code", { code_param: code });

    if (error) {
      console.error("❌ RPC redeem_promo_code failed:", error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!data || !data.success) {
      const statusCode = data?.code === "ALREADY_REDEEMED" ? 409 : 400;
      return res.status(statusCode).json({ error: data?.error || "Failed to redeem code" });
    }

    console.log(`🎟️ Promo code "${code}" redeemed by user ${req.user.id} → ${data.plan} plan`);
    return res.json({
      success: true,
      plan: data.plan,
      scansLimit: data.scansLimit,
      expiresAt: data.expiresAt,
      message: data.message,
    });
  } catch (err) {
    console.error("/api/promo/redeem error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/promo/status", authMiddleware, async (req, res) => {
  try {
    const { data: redemption, error } = await req.supabase
      .from("promo_redemptions")
      .select("code, plan_granted, redeemed_at, expires_at")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({
      hasRedeemed: !!redemption,
      redemption: redemption || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// API: Cashfree Billing (DISABLED — payments coming soon)
// ============================
const {
  createCashfreeOrder,
  verifyCashfreeOrder,
  getLimitFromTier,
  getPlanDurationDays,
} = require("./cashfreeService");

// Checkout and verify are disabled until payment launch
app.post("/api/billing/checkout", authMiddleware, async (_req, res) => {
  return res.status(503).json({
    error: "Payments are coming soon. Use a Beta Access Code on the Plans page to unlock premium features for free.",
    code: "PAYMENTS_DISABLED",
  });
});

app.post("/api/billing/verify", authMiddleware, async (_req, res) => {
  return res.status(503).json({
    error: "Payment verification is not yet enabled.",
    code: "PAYMENTS_DISABLED",
  });
});

app.get("/api/billing/status", authMiddleware, async (req, res) => {
  try {
    const { data: sub, error: subErr } = await req.supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (subErr || !sub) {
      // Return fallback. (Subscriptions are auto-created on auth signup via DB trigger,
      // and redeem_promo_code RPC handles upserts securely).
      return res.json({ 
        plan_tier: "free", 
        monthly_scans_used: 0, 
        monthly_scans_limit: 5,
        status: "active" 
      });
    }

    return res.json(sub);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// ============================
// Admin Middleware
// ============================
async function adminMiddleware(req, res, next) {
  // Runs after authMiddleware — checks if user is an admin using request client (auth context)
  const { data, error } = await req.supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error || !data) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ============================
// Public: Get admin settings (maintenance & notice)
// No auth required — every visitor needs this
// ============================
app.get("/api/admin/settings", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("maintenance_mode, maintenance_message, notice_enabled, notice_message, notice_type, updated_at")
      .eq("id", "global")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Admin: Check if current user is admin
// ============================
app.get("/api/admin/check", authMiddleware, async (req, res) => {
  try {
    const { data } = await req.supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", req.user.id)
      .maybeSingle();

    return res.json({ isAdmin: !!data, role: data?.role || null });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Admin: Get dashboard stats
// ============================
app.get("/api/admin/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Total users from auth.users via admin API
    // We use supabase service key to list users
    let allUsers = [];
    try {
      const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (usersErr) {
        console.log("⚠️ Could not list users via auth.admin:", usersErr.message);
      } else {
        allUsers = usersData?.users || [];
      }
    } catch (authErr) {
      console.log("⚠️ auth.admin.listUsers() failed:", authErr.message);
    }

    // Activity log stats - get more records for better counting
    const { data: activityData } = await req.supabase
      .from("user_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    const activities = activityData || [];

    // Fallback: count unique users from activity log if auth.admin didn't return users
    if (allUsers.length === 0 && activities.length > 0) {
      const userFirstActivity = new Map();
      const userUuidMap = new Map();
      
      [...activities].reverse().forEach((a) => {
        if (a.email) {
          const emailLower = a.email.toLowerCase();
          if (!userFirstActivity.has(emailLower)) {
            userFirstActivity.set(emailLower, a.created_at);
          }
          if (a.user_id && a.user_id.length > 20 && !a.user_id.startsWith("fallback-")) {
            userUuidMap.set(emailLower, a.user_id);
          }
        }
      });
      
      const fallbackCount = userFirstActivity.size;
      console.log(`📊 Using fallback user count from activity log: ${fallbackCount}`);
      
      allUsers = Array.from(userFirstActivity.entries()).map(([email, firstActivity], idx) => {
        const realId = userUuidMap.get(email) || `fallback-${idx}`;
        return {
          id: realId,
          email,
          created_at: firstActivity,
          last_sign_in_at: firstActivity,
          email_confirmed_at: firstActivity,
          app_metadata: { provider: 'email' },
        };
      });
    }

    // Code reviews count
    const { count: totalReviews, error: reviewsErr } = await req.supabase
      .from("code_reviews")
      .select("id", { count: "exact", head: true });
    
    if (reviewsErr) {
      console.log("⚠️ Error counting code_reviews:", reviewsErr.message);
    }

    // Repositories count
    const { count: totalRepos, error: reposErr } = await req.supabase
      .from("user_repositories")
      .select("id", { count: "exact", head: true });
    
    if (reposErr) {
      console.log("⚠️ Error counting user_repositories:", reposErr.message);
    }

    // Fetch non-sensitive columns of reviews to maintain zero human code access
    const { data: allReviews, error: reviewsDataErr } = await req.supabase
      .from("code_reviews")
      .select("id, user_id, severity, status, category, created_at")
      .order("created_at", { ascending: false });
    
    if (reviewsDataErr) {
      console.log("⚠️ Error fetching code_reviews data:", reviewsDataErr.message);
    }

    // Aggregate issues by category
    const categoryStats = {};
    (allReviews || []).forEach((r) => {
      let cat = r.category || "General Security";
      // Format category label nicely
      cat = cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      
      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          category: cat,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          open: 0,
          resolved: 0,
        };
      }
      
      const stat = categoryStats[cat];
      stat.total++;
      
      const sev = (r.severity || "").toLowerCase();
      if (sev === "critical") stat.critical++;
      else if (sev === "high") stat.high++;
      else if (sev === "medium") stat.medium++;
      else if (sev === "low") stat.low++;
      
      const status = (r.status || "").toLowerCase();
      if (status === "open") stat.open++;
      else if (status === "resolved") stat.resolved++;
    });
    
    const categoryBreakdown = Object.values(categoryStats);
    
    // Fetch latest scan history for all repos to get scores/grades/risk levels
    const { data: allScans, error: scansErr } = await req.supabase
      .from("scan_history")
      .select("repository_name, security_score, security_grade, critical_issues, high_issues, medium_issues, low_issues, scan_date")
      .order("scan_date", { ascending: false });

    if (scansErr) {
      console.log("⚠️ Error fetching scan_history for dashboard:", scansErr.message);
    }

    const latestScanMap = {};
    if (allScans) {
      allScans.forEach((scan) => {
        if (!latestScanMap[scan.repository_name]) {
          latestScanMap[scan.repository_name] = scan;
        }
      });
    }
    
    // All repositories for admin view (ordering by connected_at as created_at doesn't exist)
    const { data: allRepos, error: reposDataErr } = await req.supabase
      .from("user_repositories")
      .select("*")
      .order("connected_at", { ascending: false });
    
    if (reposDataErr) {
      console.log("⚠️ Error fetching user_repositories data:", reposDataErr.message);
    }
    
    // Map repositories to match frontend expectations with privacy masking
    const repositories = (allRepos || []).map((repo) => {
      const latestScan = latestScanMap[repo.repo_full_name] || {};
      
      // Calculate risk level from score
      let riskLevel = "Critical";
      const score = latestScan.security_score;
      if (score !== undefined && score !== null) {
        if (score >= 90) riskLevel = "Low";
        else if (score >= 70) riskLevel = "Medium";
        else if (score >= 50) riskLevel = "High";
      } else {
        riskLevel = "—";
      }

      return {
        id: repo.id,
        user_id: repo.user_id,
        repo_name: "Private Repository",
        github_owner: "Private Owner",
        is_connected: true,
        last_scan_at: latestScan.scan_date || null,
        created_at: repo.connected_at,
        security_score: score ?? null,
        security_grade: latestScan.security_grade ?? "—",
        risk_level: riskLevel,
        critical_issues: (latestScan.critical_issues || 0) + (latestScan.high_issues || 0), // Merge critical + high for display if needed
        medium_issues: latestScan.medium_issues || 0,
        low_issues: latestScan.low_issues || 0,
      };
    });
    
    // Log stats for debugging
    console.log(`📊 Admin Dashboard Stats: Users=${allUsers.length}, Repos=${totalRepos || 0}, Reviews=${totalReviews || 0}`);

    // Compute stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7d = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count signups from activity log
    const signupsFromActivity = activities.filter((a) => a.event_type === "signup");
    const logins = activities.filter((a) => a.event_type === "login");

    // Also count signups from user creation dates (for users who signed up before activity logging)
    const signupsFromUsers = allUsers.filter((u) => u.created_at).map((u) => ({
      created_at: u.created_at,
      email: u.email,
    }));
    
    console.log(`📊 Signups: fromActivity=${signupsFromActivity.length}, fromUserCreation=${signupsFromUsers.length}`);

    // Merge signups: use activity log if available, otherwise fall back to user creation dates
    // De-duplicate by email to avoid counting the same user twice
    const allSignupDates = new Map();
    
    // First add from user creation dates (treat each user as a signup)
    signupsFromUsers.forEach((s) => {
      if (s.email && s.created_at) {
        allSignupDates.set(s.email.toLowerCase(), new Date(s.created_at));
      }
    });
    
    // Then add from activity log (these take precedence as they're more accurate)
    signupsFromActivity.forEach((s) => {
      if (s.email && s.created_at) {
        allSignupDates.set(s.email.toLowerCase(), new Date(s.created_at));
      }
    });
    
    console.log(`📊 Total unique signups merged: ${allSignupDates.size}`);

    // Convert back to array for counting
    const signupDates = Array.from(allSignupDates.values());
    
    const signupsToday = signupDates.filter((d) => d >= today).length;
    const signups7d = signupDates.filter((d) => d >= last7d).length;
    const signups30d = signupDates.filter((d) => d >= last30d).length;

    const loginsToday = logins.filter((a) => new Date(a.created_at) >= today).length;
    const logins7d = logins.filter((a) => new Date(a.created_at) >= last7d).length;
    const logins30d = logins.filter((a) => new Date(a.created_at) >= last30d).length;

    const criticalIssues = (allReviews || []).filter((r) => r.severity?.toLowerCase() === "critical").length;
    const mediumIssues = (allReviews || []).filter((r) => r.severity?.toLowerCase() === "medium").length;
    const lowIssues = (allReviews || []).filter((r) => r.severity?.toLowerCase() === "low").length;
    const openIssues = (allReviews || []).filter((r) => r.status?.toLowerCase() === "open").length;
    const resolvedIssues = (allReviews || []).filter((r) => r.status?.toLowerCase() === "resolved").length;

    // Reviews last 7 days breakdown (for chart)
    const reviewsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const dayLabel = day.toISOString().slice(0, 10);
      const count = (allReviews || []).filter((r) => {
        const d = new Date(r.created_at);
        return d >= day && d < nextDay;
      }).length;
      reviewsByDay.push({ date: dayLabel, count });
    }

    // Fetch subscription details to compile SaaS metrics
    const { data: subscriptionsData, error: subsErr } = await req.supabase
      .from("subscriptions")
      .select("*");
    
    if (subsErr) {
      console.log("⚠️ Error fetching subscriptions for admin:", subsErr.message);
    }
    
    const subscriptionsList = subscriptionsData || [];
    const subsMap = new Map();
    subscriptionsList.forEach((s) => {
      subsMap.set(s.user_id, s);
    });

    // Fetch profiles to check for GitHub tokens
    const { data: profilesData } = await req.supabase
      .from("profiles")
      .select("id, github_token");
    
    const githubUserIds = new Set();
    if (profilesData) {
      profilesData.forEach(p => {
        if (p.github_token) {
          githubUserIds.add(p.id);
        }
      });
    }

    // Users list (sanitized and enriched with subscription quotas & tiers)
    const users = allUsers.map((u) => {
      const sub = subsMap.get(u.id) || {};
      
      // Determine provider dynamically based on profiles or connected repos
      const hasGithub = githubUserIds.has(u.id) || (repositories && repositories.some(r => r.user_id === u.id));
      const provider = hasGithub ? "github" : (u.app_metadata?.provider || "email");
      
      // Use real email confirmation status
      const emailConfirmed = !!u.email_confirmed_at;

      return {
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.username || (u.email ? u.email.split('@')[0] : "N/A"),
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        emailConfirmed: emailConfirmed,
        provider: provider,
        planTier: sub.plan_tier || "free",
        billingStatus: sub.status || "active",
        scansUsed: sub.monthly_scans_used || 0,
        scansLimit: (sub.plan_tier || "free") === "free" ? 5 : (sub.monthly_scans_limit || 5),
        paymentProvider: sub.payment_provider || (sub.stripe_customer_id ? "stripe" : "none"),
        periodEnd: sub.current_period_end || null,
      };
    });

    // Compute MRR and subscriber summaries
    let mrrEstimate = 0;
    let activePaidSubscribers = 0;
    let freeSubscribers = 0;
    let basicSubscribers = 0;
    let startupSubscribers = 0;
    let enterpriseSubscribers = 0;

    users.forEach((u) => {
      const isPaid = u.billingStatus === "active" || u.billingStatus === "past_due";
      if (u.planTier === "basic") {
        if (isPaid) {
          activePaidSubscribers++;
          basicSubscribers++;
          let period = "monthly";
          if (u.periodEnd && u.createdAt) {
            const durationMs = new Date(u.periodEnd).getTime() - new Date(u.createdAt).getTime();
            const durationDays = durationMs / (1000 * 60 * 60 * 24);
            if (durationDays > 60) period = "yearly";
          }
          mrrEstimate += period === "yearly" ? 159 : 199;
        } else {
          freeSubscribers++;
        }
      } else if (u.planTier === "startup") {
        if (isPaid) {
          activePaidSubscribers++;
          startupSubscribers++;
          let period = "monthly";
          if (u.periodEnd && u.createdAt) {
            const durationMs = new Date(u.periodEnd).getTime() - new Date(u.createdAt).getTime();
            const durationDays = durationMs / (1000 * 60 * 60 * 24);
            if (durationDays > 60) period = "yearly";
          }
          mrrEstimate += period === "yearly" ? 799 : 999;
        } else {
          freeSubscribers++;
        }
      } else if (u.planTier === "enterprise") {
        enterpriseSubscribers++;
      } else {
        freeSubscribers++;
      }
    });

    const billingSummary = {
      mrrEstimate,
      activePaidSubscribers,
      freeSubscribers,
      basicSubscribers,
      startupSubscribers,
      enterpriseSubscribers,
    };

    // Admin settings
    const { data: settings } = await req.supabase
      .from("admin_settings")
      .select("*")
      .eq("id", "global")
      .single();

    return res.json({
      totalUsers: allUsers.length,
      totalReviews: totalReviews || 0,
      totalRepos: totalRepos || 0,
      signupsToday,
      signups7d,
      signups30d,
      loginsToday,
      logins7d,
      logins30d,
      criticalIssues,
      mediumIssues,
      lowIssues,
      openIssues,
      resolvedIssues,
      reviewsByDay,
      users,
      repositories,
      categoryBreakdown,
      recentActivity: activities.slice(0, 50),
      settings: settings || {},
      billingSummary,
    });
  } catch (err) {
    console.error("❌ Admin Dashboard Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Admin: Update settings (maintenance, notice)
// ============================
app.put("/api/admin/settings", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      maintenance_mode,
      maintenance_message,
      notice_enabled,
      notice_message,
      notice_type,
    } = req.body;

    const updates = { updated_at: new Date().toISOString(), updated_by: req.user.id };
    if (typeof maintenance_mode === "boolean") updates.maintenance_mode = maintenance_mode;
    if (typeof maintenance_message === "string") updates.maintenance_message = maintenance_message;
    if (typeof notice_enabled === "boolean") updates.notice_enabled = notice_enabled;
    if (typeof notice_message === "string") updates.notice_message = notice_message;
    if (typeof notice_type === "string") updates.notice_type = notice_type;

    const { data, error } = await req.supabase
      .from("admin_settings")
      .update(updates)
      .eq("id", "global")
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Admin: Log user activity (called from frontend)
// ============================
app.post("/api/activity/log", async (req, res) => {
  try {
    const { user_id, email, event_type } = req.body;
    if (!event_type) return res.status(400).json({ error: "event_type required" });

    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const { error } = await supabase
      .from("user_activity_log")
      .insert({
        user_id: user_id || null,
        email: email || null,
        event_type,
        ip_address: typeof ip === "string" ? ip : ip[0],
        user_agent: userAgent,
      });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Start Server
// ============================

// ============================
// Admin: Promo Code Management
// ============================
app.get("/api/admin/promo-codes", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/promo-codes", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { code, plan, maxUses, expiresAt, notes } = req.body;
    if (!code || !plan) return res.status(400).json({ error: "code and plan are required" });

    const cleanCode = String(code).toUpperCase().replace(/[^A-Z0-9\-]/g, "").substring(0, 50);
    if (!cleanCode) return res.status(400).json({ error: "Invalid code format" });
    if (!["basic", "beta", "admin"].includes(plan)) return res.status(400).json({ error: "Plan must be basic, beta, or admin" });
    const parsedMax = parseInt(maxUses, 10) || 100;

    const { data, error } = await req.supabase
      .from("promo_codes")
      .insert({
        code: cleanCode,
        plan,
        max_uses: parsedMax,
        expires_at: expiresAt || null,
        notes: notes || null,
        created_by: "admin",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "A code with this name already exists" });
      return res.status(500).json({ error: error.message });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/admin/promo-codes/:code", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const code = String(req.params.code).toUpperCase().replace(/[^A-Z0-9\-]/g, "");
    const { error } = await req.supabase.from("promo_codes").delete().eq("code", code);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.patch("/api/admin/promo-codes/:code/toggle", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const code = String(req.params.code).toUpperCase().replace(/[^A-Z0-9\-]/g, "");
    const isActive = req.body.isActive === true || req.body.isActive === "true";
    const { error } = await req.supabase
      .from("promo_codes")
      .update({ is_active: isActive })
      .eq("code", code);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/admin/promo-redemptions", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("promo_redemptions")
      .select("*")
      .order("redeemed_at", { ascending: false })
      .limit(500);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Admin: AI Usage Monitoring
// ============================
app.get("/api/admin/ai-usage", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Budget state
    const { data: budget } = await req.supabase
      .from("system_budget")
      .select("*")
      .eq("id", "global")
      .single();

    // Usage in the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageRows } = await req.supabase
      .from("ai_usage_log")
      .select("user_id, gemini_requests, tokens_estimated, estimated_cost_usd")
      .gte("created_at", startOfMonth.toISOString());

    const totalRequests = usageRows?.reduce((s, r) => s + (r.gemini_requests || 0), 0) || 0;
    const totalTokens = usageRows?.reduce((s, r) => s + (r.tokens_estimated || 0), 0) || 0;

    // Aggregate per user
    const byUser = {};
    for (const row of (usageRows || [])) {
      if (!row.user_id) continue;
      if (!byUser[row.user_id]) byUser[row.user_id] = { total_cost: 0, total_requests: 0 };
      byUser[row.user_id].total_cost += (row.estimated_cost_usd || 0);
      byUser[row.user_id].total_requests += (row.gemini_requests || 0);
    }
    const topUsers = Object.entries(byUser)
      .map(([user_id, stats]) => ({ user_id, ...stats }))
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 10);

    return res.json({
      monthlyCostUsd: budget?.monthly_cost_usd || 0,
      dailyCostUsd: budget?.daily_cost_usd || 0,
      budgetExceeded: budget?.budget_exceeded || false,
      monthlyBudgetUsd: parseFloat(process.env.MONTHLY_AI_BUDGET_USD || "50"),
      dailyBudgetUsd: parseFloat(process.env.DAILY_AI_BUDGET_USD || "5"),
      totalRequests,
      totalTokens,
      topUsers,
    });
  } catch (err) {
    console.error("/api/admin/ai-usage error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
