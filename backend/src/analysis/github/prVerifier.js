/**
 * PR Verifier
 * 
 * Handles GitHub Pull Request verification:
 * - Fetches changed files from a PR via GitHub API
 * - Runs the Orchestrator pipeline on the delta (changed files only)
 * - Generates a markdown summary comment
 * - Posts a status check (PASS / WARN / BLOCK) on the PR
 */

const AnalysisOrchestrator = require("../orchestrator");

class PRVerifier {
  constructor() {
    this.name = "PRVerifier";
  }

  /**
   * Fetches changed files from a GitHub Pull Request
   * @param {string} repoFullName - e.g. "owner/repo"
   * @param {number} prNumber - PR number
   * @param {string} githubToken - OAuth token
   * @returns {Array} List of { path, content, size, status, patch }
   */
  async fetchPRFiles(repoFullName, prNumber, githubToken) {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Sentinel-AI-Bot",
      Authorization: `token ${githubToken}`
    };

    // Get list of changed files
    const filesUrl = `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}/files?per_page=100`;
    const filesRes = await fetch(filesUrl, { headers });
    
    if (!filesRes.ok) {
      throw new Error(`GitHub API error fetching PR files: ${filesRes.status}`);
    }
    
    const prFiles = await filesRes.json();
    const filesWithContent = [];

    for (const file of prFiles) {
      // Skip deleted files and non-code files
      if (file.status === "removed") continue;
      
      const ext = file.filename.split(".").pop().toLowerCase();
      const codeExts = new Set([
        "js", "ts", "jsx", "tsx", "py", "java", "rb", "go", "rs",
        "cpp", "c", "h", "cs", "php", "swift", "kt", "scala",
        "vue", "svelte", "html", "css", "scss", "sql", "sh", "yaml", "yml",
        "json", "xml", "env", "dockerfile", "tf"
      ]);

      if (!codeExts.has(ext)) continue;

      // Fetch file content at the PR head ref
      try {
        const contentUrl = `https://api.github.com/repos/${repoFullName}/contents/${encodeURIComponent(file.filename)}?ref=${file.sha}`;
        const contentRes = await fetch(contentUrl, { headers });
        
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          const content = Buffer.from(contentData.content || "", "base64").toString("utf-8");
          
          filesWithContent.push({
            path: file.filename,
            content,
            size: file.changes || content.length,
            status: file.status, // "added", "modified", "renamed"
            patch: file.patch || ""
          });
        }
      } catch (err) {
        console.error(`Failed to fetch content for ${file.filename}:`, err.message);
      }
    }

    return filesWithContent;
  }

  /**
   * Runs the Orchestrator verification pipeline on PR changed files
   * @param {Array} files - Files with content
   * @returns {Object} Pipeline result with findings, readiness, verdict
   */
  async verify(files) {
    const orchestrator = new AnalysisOrchestrator();
    const result = await orchestrator.runPipeline(files);
    return result;
  }

  /**
   * Generates a formatted markdown summary comment for a GitHub PR
   * @param {Object} pipelineResult - Result from orchestrator.runPipeline()
   * @param {string} repoFullName - e.g. "owner/repo"
   * @returns {string} Markdown comment body
   */
  generatePRComment(pipelineResult, repoFullName) {
    const { findings, readiness, state } = pipelineResult;
    const findingCount = findings ? findings.length : 0;

    let verdictEmoji = "✅";
    let verdictText = "PASS";
    if (readiness) {
      if (readiness.verdict === "BLOCK") { verdictEmoji = "🚫"; verdictText = "BLOCK"; }
      else if (readiness.verdict === "WARN") { verdictEmoji = "⚠️"; verdictText = "WARN"; }
    }

    let comment = `## ${verdictEmoji} Sentinel Verification — ${verdictText}\n\n`;
    comment += `**Repository:** \`${repoFullName}\`\n`;
    comment += `**Engine Status:** ${state}\n`;
    
    if (readiness) {
      comment += `**Readiness Score:** ${readiness.overallScore}/100\n\n`;
      
      // Category breakdown
      comment += `| Category | Score |\n|---|---|\n`;
      if (readiness.categoryScores) {
        for (const [cat, score] of Object.entries(readiness.categoryScores)) {
          const icon = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";
          comment += `| ${icon} ${cat} | ${score}/100 |\n`;
        }
      }
      comment += `\n`;
    }

    if (findingCount === 0) {
      comment += `### No issues detected\n`;
      comment += `All scanned files passed verification. Great work! 🎉\n`;
    } else {
      comment += `### ${findingCount} Issue(s) Found\n\n`;

      // Group findings by severity
      const bySeverity = { Critical: [], High: [], Medium: [], Low: [] };
      findings.forEach(f => {
        const sev = f.severity || "Low";
        if (bySeverity[sev]) bySeverity[sev].push(f);
        else bySeverity.Low.push(f);
      });

      for (const [sev, items] of Object.entries(bySeverity)) {
        if (items.length === 0) continue;
        const sevEmoji = sev === "Critical" ? "🔴" : sev === "High" ? "🟠" : sev === "Medium" ? "🟡" : "🟢";
        comment += `#### ${sevEmoji} ${sev} (${items.length})\n\n`;
        
        for (const item of items.slice(0, 5)) { // Limit to 5 per severity to avoid huge comments
          comment += `- **${item.title}** in \`${item.file}\`${item.line ? ` (L${item.line})` : ""}\n`;
          if (item.cwe) comment += `  CWE: ${item.cwe}\n`;
        }

        if (items.length > 5) {
          comment += `- ... and ${items.length - 5} more ${sev.toLowerCase()} issue(s)\n`;
        }
        comment += `\n`;
      }
    }

    comment += `\n---\n*Powered by [CodeAurora Sentinel](https://codeaurorasentinel.vercel.app) — AI-Powered Software Verification*`;
    
    return comment;
  }

  /**
   * Posts a comment on a GitHub PR
   * @param {string} repoFullName
   * @param {number} prNumber
   * @param {string} commentBody - Markdown comment
   * @param {string} githubToken
   */
  async postPRComment(repoFullName, prNumber, commentBody, githubToken) {
    const url = `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Sentinel-AI-Bot",
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ body: commentBody })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to post PR comment: ${res.status} ${errText}`);
    }

    return await res.json();
  }

  /**
   * Posts a commit status check on GitHub
   * @param {string} repoFullName
   * @param {string} sha - The commit SHA to set status on
   * @param {string} verdict - "PASS", "WARN", or "BLOCK"
   * @param {string} description - Short description
   * @param {string} githubToken
   */
  async postStatusCheck(repoFullName, sha, verdict, description, githubToken) {
    const stateMap = {
      PASS: "success",
      WARN: "success",   // Warnings still pass CI but show the warning
      BLOCK: "failure"
    };

    const url = `https://api.github.com/repos/${repoFullName}/statuses/${sha}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Sentinel-AI-Bot",
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        state: stateMap[verdict] || "pending",
        target_url: `https://codeaurorasentinel.vercel.app`,
        description: description.substring(0, 140), // GitHub limits to 140 chars
        context: "sentinel/verification"
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to post status check: ${res.status} ${errText}`);
    }
  }
}

module.exports = PRVerifier;
