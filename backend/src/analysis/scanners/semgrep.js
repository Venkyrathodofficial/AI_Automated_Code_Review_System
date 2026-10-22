const NormalizedFinding = require("../models/normalizedFinding");
const { execFile } = require("child_process");
const util = require("util");
const execFilePromise = util.promisify(execFile);
const fs = require("fs").promises;
const path = require("path");

class SemgrepScanner {
  constructor() {
    this.name = "SemgrepScanner";
    this.status = "IDLE"; // IDLE, COMPLETED, UNAVAILABLE, FAILED
    this.error = null;
  }

  async scan(files) {
    const findings = [];
    this.status = "RUNNING";
    this.error = null;

    if (!Array.isArray(files) || files.length === 0) {
      this.status = "COMPLETED";
      return findings;
    }

    // Create a temporary directory inside the workspace
    const workspaceTmpParent = path.join(__dirname, "../../../");
    const tmpDir = await fs.mkdtemp(path.join(workspaceTmpParent, "temp-semgrep-"));

    try {
      // Write files to tmpDir safely
      for (const file of files) {
        if (!file || !file.path) continue;
        const normalizedRelPath = path.normalize(file.path).replace(/^(\.\.[\/\\])+/, "");
        const destPath = path.join(tmpDir, normalizedRelPath);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, file.content || "");
      }

      // Execute semgrep safely using execFile without shell interpolation
      const semgrepArgs = [
        "scan",
        "--metrics=off",
        "--json",
        "--config",
        "p/default",
        tmpDir,
      ];

      let stdoutData = "";
      try {
        const { stdout } = await execFilePromise("semgrep", semgrepArgs, {
          timeout: 45000,
          maxBuffer: 10 * 1024 * 1024,
        });
        stdoutData = stdout;
      } catch (execErr) {
        // Semgrep exits with status 1 when findings are present; stdout still has valid JSON
        if (execErr.stdout && execErr.stdout.trim().startsWith("{")) {
          stdoutData = execErr.stdout;
        } else {
          // Binary missing, timeout, or crashed
          const isNotFound =
            execErr.code === "ENOENT" ||
            (execErr.message &&
              (execErr.message.includes("not found") ||
                execErr.message.includes("ENOENT")));

          if (isNotFound) {
            this.status = "UNAVAILABLE";
            this.error = "Semgrep CLI is not installed in the runtime environment.";
            throw new Error(`[SemgrepScanner] Engine unavailable: ${this.error}`);
          } else {
            this.status = "FAILED";
            this.error = execErr.message;
            throw new Error(`[SemgrepScanner] Execution failed: ${execErr.message}`);
          }
        }
      }

      // Parse JSON findings
      if (stdoutData) {
        try {
          const semgrepOutput = JSON.parse(stdoutData);
          if (semgrepOutput && Array.isArray(semgrepOutput.results)) {
            for (const result of semgrepOutput.results) {
              const relativePath = path.relative(tmpDir, result.path);

              let severity = "Medium";
              if (result.extra?.severity === "ERROR") severity = "High";
              if (result.extra?.severity === "WARNING") severity = "Medium";
              if (result.extra?.severity === "INFO") severity = "Low";

              findings.push(
                new NormalizedFinding({
                  title: result.check_id.split(".").pop() || "Semgrep Finding",
                  category: result.extra?.metadata?.cwe ? "security" : "quality",
                  severity: severity,
                  file: relativePath,
                  line: result.start?.line || 1,
                  evidence: result.extra?.lines || "",
                  scanner: this.name,
                  cwe: Array.isArray(result.extra?.metadata?.cwe)
                    ? result.extra.metadata.cwe[0]
                    : result.extra?.metadata?.cwe || null,
                })
              );
            }
          }
          this.status = "COMPLETED";
        } catch (parseErr) {
          this.status = "FAILED";
          this.error = `Failed to parse Semgrep output JSON: ${parseErr.message}`;
          throw new Error(`[SemgrepScanner] ${this.error}`);
        }
      }
    } finally {
      // Clean up temp directory safely
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
