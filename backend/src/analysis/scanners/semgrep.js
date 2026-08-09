const NormalizedFinding = require("../models/normalizedFinding");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const fs = require("fs").promises;
const os = require("os");
const path = require("path");

class SemgrepScanner {
  constructor() {
    this.name = "SemgrepScanner";
  }

  async scan(files) {
    const findings = [];
    if (files.length === 0) return findings;

    // Create a temporary directory inside the workspace to avoid Windows Semgrep non-git hangs
    const workspaceTmpParent = path.join(__dirname, "../../../");
    const tmpDir = await fs.mkdtemp(path.join(workspaceTmpParent, "temp-semgrep-"));

    try {
      // Write files to tmpDir
      for (const file of files) {
        // Ensure subdirectories exist if file.path has them
        const destPath = path.join(tmpDir, file.path);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, file.content || "");
      }

      // Run semgrep using pip-installed global package
      // Using --config "p/default" which includes standard security rules
      const safeTmpDir = tmpDir.replace(/\\/g, "/");
      const { stdout } = await execPromise(`semgrep scan --metrics=off --json --config "p/default" "${safeTmpDir}"`);
      
      const semgrepOutput = JSON.parse(stdout);
      
      if (semgrepOutput && semgrepOutput.results) {
        for (const result of semgrepOutput.results) {
          // Re-map the path back to the original file path
          const relativePath = path.relative(tmpDir, result.path);
          
          let severity = "Medium";
          if (result.extra.severity === "ERROR") severity = "High";
          if (result.extra.severity === "WARNING") severity = "Medium";
          if (result.extra.severity === "INFO") severity = "Low";

          findings.push(new NormalizedFinding({
            title: result.check_id.split('.').pop() || "Semgrep Finding",
            category: result.extra.metadata?.cwe ? "security" : "quality",
            severity: severity,
            file: relativePath,
            line: result.start.line,
            evidence: result.extra.lines || "",
            scanner: this.name,
            cwe: Array.isArray(result.extra.metadata?.cwe) ? result.extra.metadata.cwe[0] : (result.extra.metadata?.cwe || null)
          }));
        }
      }
    } catch (err) {
      // If Semgrep exits with 1, it means it found issues, stdout still has JSON.
      // If it's another error (like not installed), log it.
      if (err.stdout) {
        try {
          const semgrepOutput = JSON.parse(err.stdout);
          if (semgrepOutput && semgrepOutput.results) {
            for (const result of semgrepOutput.results) {
              const relativePath = path.relative(tmpDir, result.path);
              let severity = "Medium";
              if (result.extra.severity === "ERROR") severity = "High";
              if (result.extra.severity === "WARNING") severity = "Medium";
              if (result.extra.severity === "INFO") severity = "Low";

              findings.push(new NormalizedFinding({
                title: result.check_id.split('.').pop() || "Semgrep Finding",
                category: result.extra.metadata?.cwe ? "security" : "quality",
                severity: severity,
                file: relativePath,
                line: result.start.line,
                evidence: result.extra.lines || "",
                scanner: this.name,
                cwe: Array.isArray(result.extra.metadata?.cwe) ? result.extra.metadata.cwe[0] : (result.extra.metadata?.cwe || null)
              }));
            }
          }
        } catch (parseErr) {
          console.error(`[SemgrepScanner] Failed to parse Semgrep output: ${parseErr.message}`);
        }
      } else {
        console.warn(`[SemgrepScanner] Failed to run semgrep: ${err.message}. Ensure it is installed.`);
      }
    } finally {
      // Clean up tmp directory
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error(`[SemgrepScanner] Failed to clean up tmp dir: ${cleanupErr.message}`);
      }
    }

    return findings;
  }
}

module.exports = SemgrepScanner;
