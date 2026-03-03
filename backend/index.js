require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ============================
// Supabase Setup
// ============================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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
// GitHub API helper
// ============================
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
function ghHeaders() {
  const h = { Accept: "application/vnd.github.v3+json", "User-Agent": "AI-Code-Review-Bot" };
  if (GITHUB_TOKEN) h.Authorization = `token ${GITHUB_TOKEN}`;
  return h;
}

/** Fetch the file tree from a GitHub repo (default branch) */
async function fetchRepoTree(repoFullName) {
  // Get default branch
  const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers: ghHeaders() });
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
  const repoData = await repoRes.json();
  const branch = repoData.default_branch || "main";

  // Get full tree recursively
  const treeRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`,
    { headers: ghHeaders() }
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
async function fetchFileContent(repoFullName, filePath, ref) {
  const url = `https://api.github.com/repos/${repoFullName}/contents/${encodeURIComponent(filePath)}${ref ? `?ref=${ref}` : ""}`;
  const res = await fetch(url, { headers: ghHeaders() });
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
  // Security — Critical
  {
    id: "SEC001", pattern: /eval\s*\(/g, severity: "Critical",
    title: "Dangerous eval() usage detected",
    description: "eval() executes arbitrary code and can lead to code injection attacks.",
    suggestion: "Replace eval() with JSON.parse(), Function constructor, or a safer alternative.",
    tip: "Use a sandboxed environment if dynamic code execution is absolutely necessary.",
    riskScore: 9,
  },
  {
    id: "SEC002", pattern: /innerHTML\s*=/g, severity: "Critical",
    title: "innerHTML assignment — XSS risk",
    description: "Direct innerHTML assignment can lead to Cross-Site Scripting (XSS) vulnerabilities.",
    suggestion: "Use textContent for plain text, or sanitize HTML with DOMPurify before assigning.",
    tip: "In React, dangerouslySetInnerHTML is equally dangerous—avoid it.",
    riskScore: 9,
  },
  {
    id: "SEC003",
    pattern: /(?:password|secret|api[_-]?key|token|private[_-]?key)\s*[:=]\s*["'][^"']{4,}/gi,
    severity: "Critical",
    title: "Hardcoded secret or credential detected",
    description: "Secrets embedded in source code can be leaked through version control.",
    suggestion: "Move secrets to environment variables or a secrets manager (e.g., AWS Secrets Manager, Vault).",
    tip: "Add a pre-commit hook with tools like git-secrets or trufflehog to prevent accidental commits.",
    riskScore: 10,
  },
  {
    id: "SEC004", pattern: /exec\s*\(\s*['"`]|child_process/g, severity: "Critical",
    title: "Shell command execution detected",
    description: "Executing shell commands can lead to command injection if user input is not sanitized.",
    suggestion: "Use parameterized APIs instead of shell commands. If unavoidable, validate and escape all inputs.",
    tip: "Use execFile() instead of exec() to avoid shell interpretation of arguments.",
    riskScore: 9,
  },
  {
    id: "SEC005", pattern: /document\.write\s*\(/g, severity: "Critical",
    title: "document.write() usage detected",
    description: "document.write() can overwrite the entire page and is vulnerable to XSS.",
    suggestion: "Use DOM manipulation methods like createElement() and appendChild() instead.",
    tip: "Modern frameworks avoid document.write entirely—consider migrating.",
    riskScore: 8,
  },
  {
    id: "SEC006", pattern: /SELECT\s+.+\s+FROM\s+.+\s+WHERE\s+.+['"\+]|(\$\{|\+\s*req\.(body|query|params))/gi, severity: "Critical",
    title: "Potential SQL injection vulnerability",
    description: "String concatenation in SQL queries can allow attackers to inject malicious SQL.",
    suggestion: "Use parameterized queries or an ORM (Sequelize, Prisma, Knex) to prevent SQL injection.",
    tip: "Always validate and sanitize user inputs even when using parameterized queries.",
    riskScore: 10,
  },

  // Quality — Medium
  {
    id: "QAL001", pattern: /console\.(log|debug|info)\s*\(/g, severity: "Medium",
    title: "Console logging left in code",
    description: "Console statements should be removed from production code as they can leak information.",
    suggestion: "Remove console.log or replace with a proper logging library (winston, pino).",
    tip: "Use an ESLint rule (no-console) to catch these automatically.",
    riskScore: 4,
  },
  {
    id: "QAL002", pattern: /TODO|FIXME|HACK|XXX|TEMP/gi, severity: "Medium",
    title: "TODO/FIXME comment found",
    description: "Code contains unresolved TODO or FIXME comments indicating incomplete work.",
    suggestion: "Address the TODO item or create a tracking issue, then remove the comment.",
    tip: "Use IDE extensions to track and manage TODO comments across your project.",
    riskScore: 3,
  },
  {
    id: "QAL003", pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g, severity: "Medium",
    title: "Empty catch block — errors silently swallowed",
    description: "Empty catch blocks hide errors, making debugging extremely difficult.",
    suggestion: "At minimum, log the error. Better: handle it properly or re-throw.",
    tip: "Consider using error monitoring tools like Sentry to catch unhandled exceptions.",
    riskScore: 5,
  },
  {
    id: "QAL004", pattern: /var\s+\w/g, severity: "Medium",
    title: "Usage of 'var' — prefer let/const",
    description: "'var' has function scope and can lead to bugs due to hoisting. Modern JS uses let/const.",
    suggestion: "Replace 'var' with 'const' (if not reassigned) or 'let' (if reassigned).",
    tip: "Enable ESLint's no-var rule to enforce this automatically.",
    riskScore: 3,
  },
  {
    id: "QAL005", pattern: /==(?!=)|!=(?!=)/g, severity: "Medium",
    title: "Loose equality operator (== or !=)",
    description: "Loose equality performs type coercion which can lead to unexpected behavior.",
    suggestion: "Use strict equality (=== and !==) to avoid type coercion bugs.",
    tip: "ESLint's eqeqeq rule can enforce strict equality across your codebase.",
    riskScore: 4,
  },
  {
    id: "QAL006", pattern: /function\s+\w+\s*\([^)]{80,}\)/g, severity: "Medium",
    title: "Function has too many parameters",
    description: "Functions with many parameters are hard to use and maintain.",
    suggestion: "Refactor to use an options/config object pattern instead of many positional parameters.",
    tip: "The ideal maximum is 3 parameters. Use destructuring for clarity.",
    riskScore: 4,
  },

  // Performance — Medium
  {
    id: "PRF001", pattern: /\.forEach\s*\(.*await/g, severity: "Medium",
    title: "Await inside forEach — sequential execution",
    description: "Using await inside forEach doesn't pause iteration; this can cause race conditions.",
    suggestion: "Use a for...of loop for sequential execution, or Promise.all() for parallel.",
    tip: "for...of + await is the correct pattern for sequential async iteration.",
    riskScore: 5,
  },
  {
    id: "PRF002", pattern: /new Date\(\).*(?:while|for)\b|(?:while|for)\b.*new Date\(\)/g, severity: "Medium",
    title: "Date created inside a loop",
    description: "Creating Date objects inside loops is unnecessary and hurts performance.",
    suggestion: "Move the Date creation outside the loop.",
    tip: "Use performance.now() for timing operations instead of Date.",
    riskScore: 3,
  },

  // Best Practice — Low
  {
    id: "BP001", pattern: /\/\/.*\n.*\/\/.*\n.*\/\/.*\n.*\/\/.*\n.*\/\//g, severity: "Low",
    title: "Excessive inline comments",
    description: "Too many inline comments can indicate code that needs better naming or refactoring.",
    suggestion: "Write self-documenting code with clear variable and function names.",
    tip: "Comments should explain WHY, not WHAT. Well-named code explains itself.",
    riskScore: 1,
  },
  {
    id: "BP002", pattern: /(?:if|else|for|while|switch)\s*\(.*\)\s*\n?\s*(?:if|else|for|while|switch)\s*\(.*\)\s*\n?\s*(?:if|else|for|while|switch)/g, severity: "Low",
    title: "Deeply nested control flow detected",
    description: "Deeply nested if/for/while blocks reduce readability and increase complexity.",
    suggestion: "Extract nested logic into separate functions. Use early returns to reduce nesting.",
    tip: "Aim for a maximum nesting depth of 2-3. Use guard clauses to flatten logic.",
    riskScore: 2,
  },
  {
    id: "BP003", pattern: /\.then\s*\(.*\.then\s*\(.*\.then/g, severity: "Low",
    title: "Promise chain nesting (callback hell)",
    description: "Deeply chained .then() calls are hard to read and maintain.",
    suggestion: "Refactor to async/await syntax for cleaner, more readable asynchronous code.",
    tip: "async/await is syntactic sugar over Promises and works with all Promise-based APIs.",
    riskScore: 2,
  },
  {
    id: "BP004", pattern: /import\s+.*\s+from\s+['"](?!\.)[^'"]+['"].*\n.*import\s+.*\s+from\s+['"](?!\.)/g, severity: "Low",
    title: "Imports could be organized better",
    description: "External and internal imports should be grouped and ordered consistently.",
    suggestion: "Group imports: 1) built-in modules, 2) external packages, 3) internal modules.",
    tip: "Use ESLint plugin import/order or Prettier to auto-sort imports.",
    riskScore: 1,
  },
  {
    id: "BP005", pattern: /\n{4,}/g, severity: "Low",
    title: "Excessive blank lines",
    description: "Multiple consecutive blank lines reduce code density and readability.",
    suggestion: "Use a maximum of one blank line to separate logical sections.",
    tip: "Configure Prettier's max-empty-lines option to enforce this.",
    riskScore: 1,
  },

  // Dependency / Config
  {
    id: "DEP001", pattern: /"dependencies"\s*:\s*\{[^}]*"\*"/g, severity: "Critical",
    title: "Wildcard dependency version detected",
    description: "Using '*' for dependency versions can pull in breaking or malicious updates.",
    suggestion: "Pin dependency versions or use semver ranges (^1.2.3).",
    tip: "Use npm audit and renovatebot to keep dependencies secure and up to date.",
    riskScore: 8,
  },
  {
    id: "ENV001", pattern: /^(?!#).*(?:PASSWORD|SECRET|KEY|TOKEN)\s*=.+/gim, severity: "Critical",
    title: "Secret value in config/env file",
    description: "This file contains secret values that may be committed to version control.",
    suggestion: "Ensure this file is in .gitignore. Use environment variables in deployment.",
    tip: "Use dotenv for local dev, and platform-native secrets (Render/Vercel env vars) in production.",
    riskScore: 9,
  },
];

/** Analyze a single file's content and return issues found */
function analyzeFile(filePath, content) {
  const issues = [];
  const ext = filePath.lastIndexOf(".") >= 0 ? filePath.substring(filePath.lastIndexOf(".")).toLowerCase() : "";

  // Skip minified files
  const avgLineLength = content.length / Math.max(1, content.split("\n").length);
  if (avgLineLength > 200) return issues;

  for (const rule of analysisRules) {
    // Reset regex lastIndex
    rule.pattern.lastIndex = 0;
    const matches = content.match(rule.pattern);
    if (matches && matches.length > 0) {
      // Find line number of first match
      rule.pattern.lastIndex = 0;
      const firstMatch = rule.pattern.exec(content);
      let lineNumber = 0;
      if (firstMatch) {
        lineNumber = content.substring(0, firstMatch.index).split("\n").length;
      }

      issues.push({
        ruleId: rule.id,
        file_name: filePath,
        issue_title: rule.title,
        issue_description: `${rule.description} (${matches.length} occurrence${matches.length > 1 ? "s" : ""} found${lineNumber ? `, first at line ${lineNumber}` : ""})`,
        severity: rule.severity,
        suggestion: rule.suggestion,
        optimization_tip: rule.tip,
        risk_score: rule.riskScore,
        occurrences: matches.length,
      });
    }
  }

  return issues;
}

/** Scan an entire repo: fetch files and analyze each one */
async function scanRepository(repoFullName, userId, ref) {
  console.log(`🔍 Starting full scan of ${repoFullName} for user ${userId}`);

  let files;
  try {
    files = await fetchRepoTree(repoFullName);
  } catch (err) {
    console.error(`   ❌ Cannot access repo ${repoFullName}:`, err.message);
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
    }]);
    return { filesScanned: 0, issuesFound: 0, error: err.message };
  }

  console.log(`   Found ${files.length} code files to analyze`);

  // Limit to 50 files per scan to stay within GitHub rate limits
  const filesToScan = files.slice(0, 50);
  const allIssues = [];

  for (const file of filesToScan) {
    try {
      const content = await fetchFileContent(repoFullName, file.path, ref);
      if (!content) continue;

      const fileIssues = analyzeFile(file.path, content);
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
        });
      }
    } catch (err) {
      console.error(`   ⚠️ Error analyzing ${file.path}:`, err.message);
    }
  }

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
    }]);
    console.log(`   ✅ Clean scan for ${repoFullName} (no issues)`);
  }

  return { filesScanned: filesToScan.length, issuesFound: allIssues.length };
}

/** Analyze only specific files (for webhook pushes) */
async function analyzeChangedFiles(repoFullName, userId, filePaths, commitId, commitMessage) {
  console.log(`🔍 Analyzing ${filePaths.length} changed files in ${repoFullName}`);

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
      const content = await fetchFileContent(repoFullName, filePath, commitId);
      if (!content) continue;

      const fileIssues = analyzeFile(filePath, content);
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
        });
      }
    } catch (err) {
      console.error(`   ⚠️ Error analyzing ${filePath}:`, err.message);
    }
  }

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
    }]);
    console.log(`   ✅ Clean push to ${repoFullName}`);
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

    const { data: reviews, error: revErr } = await req.supabase
      .from("code_reviews")
      .select("*")
      .eq("user_id", req.user.id)
      .in("repository_name", repoNames);

    if (revErr) {
      return res.status(500).json({ error: revErr.message });
    }

    const repoMap = {};
    userRepos.forEach((ur) => {
      repoMap[ur.repo_full_name] = {
        name: ur.repo_full_name,
        totalReviews: 0,
        critical: 0,
        medium: 0,
        low: 0,
        open: 0,
        resolved: 0,
        lastReviewDate: null,
        files: new Set(),
        connectedAt: ur.connected_at,
        webhookSecret: ur.webhook_secret,
      };
    });

    (reviews || []).forEach((r) => {
      const name = r.repository_name;
      if (!repoMap[name]) return;
      const repo = repoMap[name];
      repo.totalReviews++;
      const sev = (r.severity || "").toLowerCase();
      if (sev === "critical") repo.critical++;
      else if (sev === "medium") repo.medium++;
      else repo.low++;
      const st = (r.status || "").toLowerCase();
      if (st === "resolved") repo.resolved++;
      else repo.open++;
      if (r.file_name) repo.files.add(r.file_name);
      if (r.created_at && (!repo.lastReviewDate || r.created_at > repo.lastReviewDate)) {
        repo.lastReviewDate = r.created_at;
      }
    });

    const repos = Object.values(repoMap).map((r) => {
      const total = r.critical + r.medium + r.low;
      const healthScore = total === 0 ? 100 : Math.max(0, Math.round(100 - (r.critical * 15 + r.medium * 5 + r.low * 1)));
      return {
        name: r.name,
        totalReviews: r.totalReviews,
        critical: r.critical,
        medium: r.medium,
        low: r.low,
        open: r.open,
        resolved: r.resolved,
        healthScore,
        lastReviewDate: r.lastReviewDate,
        filesReviewed: r.files.size,
        connectedAt: r.connectedAt,
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
    const checkRes = await fetch(`https://api.github.com/repos/${repoFullName.trim()}`, { headers: ghHeaders() });
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
    return res.json(data || []);
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
    return res.json({
      totalReviews: reviews.length,
      critical: reviews.filter((r) => r.severity?.toLowerCase() === "critical").length,
      medium: reviews.filter((r) => r.severity?.toLowerCase() === "medium").length,
      low: reviews.filter((r) => r.severity?.toLowerCase() === "low").length,
      open: reviews.filter((r) => r.status?.toLowerCase() === "open").length,
      resolved: reviews.filter((r) => r.status?.toLowerCase() === "resolved").length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
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
    console.log(`✅ Webhook received for user ${userId}`);

    const repository = req.body.repository?.full_name || "Unknown Repo";
    const head = req.body.head_commit || {};

    // Verify this repo is connected to this user
    const { data: userRepo } = await supabase
      .from("user_repositories")
      .select("*")
      .eq("user_id", userId)
      .eq("repo_full_name", repository)
      .single();

    if (!userRepo) {
      console.log(`⚠️ Repo ${repository} not connected for user ${userId}`);
      return res.status(404).send("Repository not connected for this user");
    }

    // Verify webhook signature if present
    const sig = req.headers["x-hub-signature-256"];
    if (sig && userRepo.webhook_secret) {
      const hmac = crypto
        .createHmac("sha256", userRepo.webhook_secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (sig !== `sha256=${hmac}`) {
        return res.status(401).send("Invalid signature");
      }
    }

    // Respond immediately, then analyze in background
    res.status(200).send("OK");

    // Collect all changed files from the push
    const modifiedFiles = head.modified || [];
    const addedFiles = head.added || [];
    const allFiles = [...new Set([...modifiedFiles, ...addedFiles])];

    if (allFiles.length > 0) {
      analyzeChangedFiles(repository, userId, allFiles, head.id, head.message).catch((err) => {
        console.error("❌ Webhook analysis error:", err.message);
      });
    }
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Legacy webhook (backwards compat)
app.post("/webhook/github", async (req, res) => {
  try {
    const repository = req.body.repository?.full_name || "Unknown Repo";
    const head = req.body.head_commit || {};

    const { data: userRepo } = await supabase
      .from("user_repositories")
      .select("user_id")
      .eq("repo_full_name", repository)
      .limit(1)
      .single();

    const userId = userRepo?.user_id || null;

    // Respond immediately
    res.status(200).send("OK");

    if (userId) {
      const modifiedFiles = head.modified || [];
      const addedFiles = head.added || [];
      const allFiles = [...new Set([...modifiedFiles, ...addedFiles])];

      if (allFiles.length > 0) {
        analyzeChangedFiles(repository, userId, allFiles, head.id, head.message).catch((err) => {
          console.error("❌ Legacy webhook analysis error:", err.message);
        });
      }
    }
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
      repoFullName = repoFullName.trim()
        .replace(/^https?:\/\/(www\.)?github\.com\//, "")
        .replace(/\.git$/, "")
        .replace(/\/$/, "");
    }
    if (!repoFullName) {
      return res.status(400).json({ error: "Provide repoFullName" });
    }

    // Verify repo is connected
    const { data: userRepo } = await req.supabase
      .from("user_repositories")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("repo_full_name", repoFullName)
      .single();

    if (!userRepo) {
      return res.status(404).json({ error: "Repository not connected" });
    }

    // Start scan in background
    res.json({ success: true, message: `Scan started for ${repoFullName}. Results will appear on your dashboard shortly.` });

    scanRepository(repoFullName, req.user.id).catch((err) => {
      console.error("❌ Manual scan error:", err.message);
    });
  } catch (err) {
    console.error("❌ Scan Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Start Server
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});