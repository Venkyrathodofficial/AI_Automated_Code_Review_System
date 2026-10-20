const fetch = require("node-fetch");
const NormalizedFinding = require("../models/normalizedFinding");

class DependencyScanner {
  constructor() {
    this.name = "OSVDependencyScanner";
    this.osvApiUrl = "https://api.osv.dev/v1/query";
  }

  async scan(files) {
    const findings = [];
    const pkgFiles = files.filter(f => f.path.endsWith("package.json"));

    for (const file of pkgFiles) {
      if (!file.content) continue;
      
      try {
        const pkg = JSON.parse(file.content);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        for (const [name, versionRange] of Object.entries(deps)) {
          // Clean the version (remove ^ or ~) to get a base version for OSV query
          // A real implementation would resolve the exact locked version from package-lock.json,
          // but for this MVP we approximate by checking the minimum requested version.
          const version = versionRange.replace(/[\^~><=]/g, "").trim();
          
          if (!version || version === "*" || version === "latest") continue;

          try {
            const res = await fetch(this.osvApiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                version: version,
                package: { name: name, ecosystem: "npm" }
              })
            });

            if (res.ok) {
              const data = await res.json();
              if (data.vulns && data.vulns.length > 0) {
                data.vulns.forEach(vuln => {
                  const title = vuln.summary || `Vulnerability in ${name}`;
                  const description = vuln.details || `Known CVE detected in package ${name}@${version}`;
                  const cve = vuln.aliases ? vuln.aliases.find(a => a.startsWith("CVE")) || vuln.id : vuln.id;

                  // Determine severity based on CVSS if available, otherwise High
                  let severity = "High"; // default
                  if (vuln.database_specific && vuln.database_specific.severity) {
                    severity = vuln.database_specific.severity;
                  }

                  findings.push(new NormalizedFinding({
                    scanner: this.name,
                    file: file.path,
                    severity: severity,
                    title: `[OSV] ${title}`,
                    description: `${description}\nAdvisory: ${cve}`,
                    evidence: `"${name}": "${versionRange}"`,
                    category: "insecure_dependency",
                    cwe: "CWE-1104", // Using a general dependency weakness CWE
                    confidence: 0.99 // OSV matches are deterministic
                  }));
                });
              }
            }
          } catch (apiErr) {
            console.error(`OSV API Error for ${name}:`, apiErr.message);
          }
        }
      } catch (err) {
        console.error(`Failed to parse ${file.path}:`, err.message);
      }
    }

    return findings;
  }
}

module.exports = DependencyScanner;
