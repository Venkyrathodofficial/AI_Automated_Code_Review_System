const fetch = require("node-fetch");
const NormalizedFinding = require("../models/normalizedFinding");

/**
 * Sentinel Supply Chain — OSV Dependency Scanner
 * Parses npm package.json and package-lock.json (v1, v2, v3),
 * resolves direct and transitive dependencies,
 * and performs sub-second batch vulnerability lookups via the OSV Batch API.
 */
class DependencyScanner {
  constructor() {
    this.name = "OSVDependencyScanner";
    this.osvBatchUrl = "https://api.osv.dev/v1/querybatch";
    this.osvQueryUrl = "https://api.osv.dev/v1/query";
    this.cache = new Map(); // In-memory cache: "pkgName@version" -> vulns[]
  }

  /**
   * Extracts direct package names from a package.json content string
   */
  _parseDirectDependencies(packageJsonContent) {
    const directNames = new Set();
    try {
      const pkg = JSON.parse(packageJsonContent);
      const allDirect = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const name of Object.keys(allDirect)) {
        directNames.add(name);
      }
    } catch (err) {
      // Ignored if invalid JSON
    }
    return directNames;
  }

  /**
   * Resolves dependencies from package-lock.json (supporting v1, v2, v3)
   * Returns Map: "pkgName@version" -> { name, version, isDirect, path }
   */
  _parsePackageLock(lockContent, directDepsSet, lockfilePath) {
    const packagesMap = new Map();

    try {
      const lock = JSON.parse(lockContent);

      // Lockfile Version 2 or 3 (npm 7+) uses "packages" object
      if (lock.packages && typeof lock.packages === "object") {
        for (const [pkgPath, pkgInfo] of Object.entries(lock.packages)) {
          // Skip the root package itself ("")
          if (!pkgPath || pkgPath === "") continue;
          if (!pkgInfo.version) continue;

          // Extract package name from node_modules path
          // E.g. "node_modules/@babel/core" -> "@babel/core"
          // E.g. "node_modules/express/node_modules/qs" -> "qs"
          const pathParts = pkgPath.split("node_modules/");
          const name = pkgInfo.name || pathParts[pathParts.length - 1];
          const version = pkgInfo.version.trim();

          if (!name || !version || version.startsWith("file:") || version.startsWith("link:")) {
            continue;
          }

          const isDirect = directDepsSet.has(name) && !pkgPath.includes("node_modules/.*node_modules/");
          const key = `${name}@${version}`;

          if (!packagesMap.has(key)) {
            packagesMap.set(key, {
              name,
              version,
              isDirect,
              lockfilePath,
            });
          }
        }
      }

      // Lockfile Version 1 (or fallback dependencies object in v2)
      if (lock.dependencies && typeof lock.dependencies === "object") {
        const traverseDeps = (depsObj, isRootLevel = true) => {
          for (const [name, depInfo] of Object.entries(depsObj)) {
            if (!depInfo || !depInfo.version) continue;
            const version = depInfo.version.trim();
            const key = `${name}@${version}`;

            if (!packagesMap.has(key)) {
              packagesMap.set(key, {
                name,
                version,
                isDirect: isRootLevel && directDepsSet.has(name),
                lockfilePath,
              });
            }

            if (depInfo.dependencies) {
              traverseDeps(depInfo.dependencies, false);
            }
          }
        };

        traverseDeps(lock.dependencies, true);
      }
    } catch (err) {
      console.warn(`[OSVDependencyScanner] Error parsing ${lockfilePath}: ${err.message}`);
    }

    return packagesMap;
  }

  /**
   * Fallback: Resolves direct dependencies from package.json alone
   */
  _parsePackageJsonDirect(pkgContent, pkgPath) {
    const packagesMap = new Map();
    try {
      const pkg = JSON.parse(pkgContent);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      for (const [name, versionRange] of Object.entries(deps)) {
        const cleanVersion = String(versionRange).replace(/[\^~><=]/g, "").trim();
        if (!cleanVersion || cleanVersion === "*" || cleanVersion === "latest") continue;

        const key = `${name}@${cleanVersion}`;
        packagesMap.set(key, {
          name,
          version: cleanVersion,
          isDirect: true,
          lockfilePath: pkgPath,
          rawVersionRange: versionRange,
        });
      }
    } catch (err) {
      console.warn(`[OSVDependencyScanner] Error parsing ${pkgPath}: ${err.message}`);
    }
    return packagesMap;
  }

  /**
   * Queries OSV API in batches of up to 100 packages
   */
  async _queryOsvBatch(packagesList) {
    const results = new Map(); // key -> vulns[]
    const uncached = [];

    // Check in-memory cache first
    for (const pkg of packagesList) {
      const key = `${pkg.name}@${pkg.version}`;
      if (this.cache.has(key)) {
        results.set(key, this.cache.get(key));
      } else {
        uncached.push(pkg);
      }
    }

    if (uncached.length === 0) return results;

    const BATCH_SIZE = 100;
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
      const chunk = uncached.slice(i, i + BATCH_SIZE);
      const payload = {
        queries: chunk.map((p) => ({
          package: { name: p.name, ecosystem: "npm" },
          version: p.version,
        })),
      };

      try {
        const res = await fetch(this.osvBatchUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          timeout: 15000,
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            data.results.forEach((item, idx) => {
              const pkg = chunk[idx];
              const key = `${pkg.name}@${pkg.version}`;
              const vulns = item.vulns || [];
              this.cache.set(key, vulns);
              results.set(key, vulns);
            });
          }
        } else {
          // Fallback to empty if batch endpoint fails to avoid breaking scan
          console.warn(`[OSVDependencyScanner] OSV batch API returned ${res.status}`);
          chunk.forEach((p) => {
            const key = `${p.name}@${p.version}`;
            results.set(key, []);
          });
        }
      } catch (err) {
        console.warn(`[OSVDependencyScanner] Batch query failed: ${err.message}`);
        chunk.forEach((p) => {
          const key = `${p.name}@${p.version}`;
          results.set(key, []);
        });
      }
    }

    return results;
  }

  async scan(files) {
    const findings = [];
    if (!Array.isArray(files) || files.length === 0) return findings;

    const lockFiles = files.filter((f) => f.path.endsWith("package-lock.json"));
    const pkgFiles = files.filter((f) => f.path.endsWith("package.json"));

    // Find all direct dependencies declared in package.json
    const directDepsSet = new Set();
    for (const f of pkgFiles) {
      if (f.content) {
        const names = this._parseDirectDependencies(f.content);
        names.forEach((n) => directDepsSet.add(n));
      }
    }

    let allResolvedPackages = new Map();

    if (lockFiles.length > 0) {
      // Priority 1: Full transitive resolution from lockfile
      for (const lf of lockFiles) {
        if (!lf.content) continue;
        const parsed = this._parsePackageLock(lf.content, directDepsSet, lf.path);
        parsed.forEach((val, key) => allResolvedPackages.set(key, val));
      }
    } else if (pkgFiles.length > 0) {
      // Fallback: Direct dependencies from package.json alone
      for (const pf of pkgFiles) {
        if (!pf.content) continue;
        const parsed = this._parsePackageJsonDirect(pf.content, pf.path);
        parsed.forEach((val, key) => allResolvedPackages.set(key, val));
      }
    }

    if (allResolvedPackages.size === 0) return findings;

    // Batch query OSV
    const packagesArray = Array.from(allResolvedPackages.values());
    const osvResults = await this._queryOsvBatch(packagesArray);

    const seenVulnKeys = new Set();

    for (const pkg of packagesArray) {
      const key = `${pkg.name}@${pkg.version}`;
      const vulns = osvResults.get(key) || [];

      for (const vuln of vulns) {
        const vulnId = vuln.id || "VULN";
        const dedupKey = `${vulnId}:${key}`;
        if (seenVulnKeys.has(dedupKey)) continue;
        seenVulnKeys.add(dedupKey);

        const title = vuln.summary || `Vulnerability in ${pkg.name}`;
        const description = vuln.details || `Known CVE detected in package ${pkg.name}@${pkg.version}`;
        const cve =
          vuln.aliases && Array.isArray(vuln.aliases)
            ? vuln.aliases.find((a) => a.startsWith("CVE")) || vuln.id
            : vuln.id;

        // Extract fixed version from affected ranges
        let fixedVersion = null;
        if (Array.isArray(vuln.affected)) {
          for (const aff of vuln.affected) {
            if (aff.ranges && Array.isArray(aff.ranges)) {
              for (const r of aff.ranges) {
                if (r.events && Array.isArray(r.events)) {
                  const fixEvent = r.events.find((e) => e.fixed);
                  if (fixEvent) fixedVersion = fixEvent.fixed;
                }
              }
            }
          }
        }

        // Determine severity
        let severity = "High";
        if (vuln.database_specific && vuln.database_specific.severity) {
          severity = vuln.database_specific.severity;
        }

        const depTypeLabel = pkg.isDirect ? "Direct Dependency" : "Transitive Dependency";
        const fixLabel = fixedVersion ? `Upgrade to version ${fixedVersion} or later.` : "Check advisory for fixed releases.";

        findings.push(
          new NormalizedFinding({
            scanner: this.name,
            file: pkg.lockfilePath,
            line: 1,
            severity: severity,
            title: `[OSV] ${title}`,
            description: `${description}\nAdvisory: ${cve} (${depTypeLabel})`,
            evidence: `"${pkg.name}": "${pkg.version}" (${depTypeLabel})`,
            category: "insecure_dependency",
            cwe: "CWE-1104",
            confidence: 0.99, // Deterministic database matching
            secure_fix: fixLabel,
          })
        );
      }
    }

    return findings;
  }
}

module.exports = DependencyScanner;
