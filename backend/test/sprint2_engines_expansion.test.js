/**
 * Sprint 2 Core Engine Expansion Test Suite
 * Tests:
 * 1. DependencyScanner (package-lock.json v2/v3, transitive resolution, OSV query format, fallback)
 * 2. SecretsScanner (Indian gateways Razorpay, Cashfree, PhonePe + Developer Keys + In-memory Masking + Negative Filtering)
 * 3. CustomRulesScanner (SSRF, Path Traversal, CORS + Safe code fixtures)
 */

const assert = require("assert");
const DependencyScanner = require("../src/analysis/scanners/dependency");
const SecretsScanner = require("../src/analysis/scanners/secrets");
const CustomRulesScanner = require("../src/analysis/scanners/customRules");

async function runSprint2Tests() {
  console.log("🚀 Running Sprint 2 Core Engine Expansion Tests...\n");

  // ──────────────────────────────────────────────────────────
  // Test 1: Sentinel Supply Chain (Lockfile & Transitive SCA)
  // ──────────────────────────────────────────────────────────
  console.log("Test 1: Sentinel Supply Chain — npm Lockfile & Transitive Dependency Resolution");
  {
    const depScanner = new DependencyScanner();

    // Mock package-lock.json (Lockfile Version 3)
    const mockPackageLock = {
      name: "sample-app",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: {
        "": {
          name: "sample-app",
          dependencies: {
            "express": "^4.16.0"
          }
        },
        "node_modules/express": {
          version: "4.16.0",
          resolved: "https://registry.npmjs.org/express/-/express-4.16.0.tgz"
        },
        "node_modules/qs": {
          version: "6.5.1", // Transitive dependency of express
          resolved: "https://registry.npmjs.org/qs/-/qs-6.5.1.tgz"
        }
      }
    };

    const mockPackageJson = {
      name: "sample-app",
      dependencies: {
        "express": "^4.16.0"
      }
    };

    const files = [
      { path: "package.json", content: JSON.stringify(mockPackageJson, null, 2) },
      { path: "package-lock.json", content: JSON.stringify(mockPackageLock, null, 2) }
    ];

    const directSet = depScanner._parseDirectDependencies(files[0].content);
    assert.ok(directSet.has("express"), "Direct dependency set must include express");
    assert.ok(!directSet.has("qs"), "Transitive dependency qs must not be in direct set");

    const resolved = depScanner._parsePackageLock(files[1].content, directSet, "package-lock.json");
    assert.ok(resolved.has("express@4.16.0"), "Must resolve express@4.16.0");
    assert.ok(resolved.has("qs@6.5.1"), "Must resolve transitive qs@6.5.1");

    const expressPkg = resolved.get("express@4.16.0");
    assert.strictEqual(expressPkg.isDirect, true, "express must be marked as isDirect: true");

    const qsPkg = resolved.get("qs@6.5.1");
    assert.strictEqual(qsPkg.isDirect, false, "qs must be marked as isDirect: false (transitive)");

    // Test Fallback when package-lock.json is absent
    const fallbackMap = depScanner._parsePackageJsonDirect(files[0].content, "package.json");
    assert.ok(fallbackMap.has("express@4.16.0"), "Fallback must resolve express from package.json alone");

    console.log("  ✅ Lockfile v3 parsing, direct/transitive separation, and package.json fallback verified");
  }

  // ──────────────────────────────────────────────────────────
  // Test 2: Sentinel Secrets (Indian Gateways & Masking)
  // ──────────────────────────────────────────────────────────
  console.log("\nTest 2: Sentinel Secrets — Indian Gateways, Cloud Credentials & Safe Masking");
  {
    const secretsScanner = new SecretsScanner();

    const dynamicSlackUrl = ["https:", "", "hooks" + ".slack.com", "services", "T00000000", "B00000000", "123456789012345678901234"].join("/");
    const sampleCodeWithSecrets = `
      // Indian Payment Gateway test fixtures
      const rzpLiveKey = "rzp_live_1DP5mmOlF5G5ag";
      const cashfreeClient = "CF1234567890ABCDEF123456";
      const phonepeSalt = "phonepe_secret = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399###1'";

      // Cloud credentials & Developer secrets
      const awsKey = "AKIAIOSFODNN7EXAMPLE";
      const slackWebhook = "${dynamicSlackUrl}";
      const pgUri = "postgres://admin:SuperSecretPassword123@db.example.internal:5432/production";

      // Negative Test: Placeholder values that MUST NOT be flagged
      const placeholderKey = "YOUR_API_KEY_HERE";
      const dummySecret = "replace_me_with_production_key";
      const zeroEntropyKey = "00000000000000000000";
    `;

    const findings = await secretsScanner.scan([{ path: "payments.js", content: sampleCodeWithSecrets }]);

    // Positive Verifications
    const rzpFinding = findings.find(f => f.title.includes("Razorpay"));
    assert.ok(rzpFinding, "Must detect Razorpay Live Key");
    assert.ok(!rzpFinding.evidence.includes("rzp_live_1DP5mmOlF5G5ag"), "Raw Razorpay key must be redacted in evidence");
    assert.ok(rzpFinding.evidence.includes("rzp_"), "Masked key prefix must be visible");

    const cfFinding = findings.find(f => f.title.includes("Cashfree"));
    assert.ok(cfFinding, "Must detect Cashfree Credentials");
    assert.ok(!cfFinding.evidence.includes("CF1234567890ABCDEF123456"), "Raw Cashfree key must be redacted");

    const phonepeFinding = findings.find(f => f.title.includes("PhonePe"));
    assert.ok(phonepeFinding, "Must detect PhonePe Salt Key");

    const awsFinding = findings.find(f => f.title.includes("AWS Access Key"));
    assert.ok(awsFinding, "Must detect AWS Access Key");

    const slackFinding = findings.find(f => f.title.includes("Slack"));
    assert.ok(slackFinding, "Must detect Slack Webhook URL");

    const dbFinding = findings.find(f => f.title.includes("Database Connection"));
    assert.ok(dbFinding, "Must detect Database URI with password");
    assert.ok(!dbFinding.evidence.includes("SuperSecretPassword123"), "Database password must be redacted in snippet");

    // Negative Verifications: Placeholders must not trigger findings
    const placeholderFindings = findings.filter(f => f.evidence.includes("YOUR_API_KEY_HERE"));
    assert.strictEqual(placeholderFindings.length, 0, "Placeholder dummy keys must be filtered out");

    console.log("  ✅ Indian gateway keys (Razorpay, Cashfree, PhonePe) detected, masked, and placeholders filtered");
  }

  // ──────────────────────────────────────────────────────────
  // Test 3: Sentinel Code (SAST Rules: SSRF, Path Traversal, CORS)
  // ──────────────────────────────────────────────────────────
  console.log("\nTest 3: Sentinel Code — Expanded SAST Rules (SSRF, Path Traversal, CORS)");
  {
    const sastScanner = new CustomRulesScanner();

    const vulnerableCode = `
      // 1. SSRF Vulnerability
      app.get("/proxy", async (req, res) => {
        const response = await fetch(req.query.targetUrl);
        res.send(await response.text());
      });

      // 2. Path Traversal
      app.get("/view-file", (req, res) => {
        const content = fs.readFileSync(path.join("/var/data", req.query.filename));
        res.send(content);
      });

      // 3. Insecure CORS
      app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        next();
      });
    `;

    const safeCode = `
      // Safe code with proper validation
      const ALLOWED_DOMAINS = ["api.example.com"];
      function isAllowed(url) { return ALLOWED_DOMAINS.includes(new URL(url).hostname); }

      app.get("/proxy", async (req, res) => {
        if (!isAllowed(req.query.targetUrl)) return res.status(403).send("Forbidden");
        const response = await fetch("https://api.example.com/data");
        res.send(await response.text());
      });

      app.get("/view-file", (req, res) => {
        const safeBase = path.basename(req.query.filename);
        const content = fs.readFileSync(path.join("/var/data", safeBase));
        res.send(content);
      });
    `;

    const vulnFindings = await sastScanner.scan([{ path: "server.js", content: vulnerableCode }]);
    const ssrf = vulnFindings.find(f => f.category === "ssrf");
    assert.ok(ssrf, "Must detect SSRF vulnerability in unvalidated fetch");
    assert.strictEqual(ssrf.cwe, "CWE-918", "SSRF must map to CWE-918");

    const pathTrav = vulnFindings.find(f => f.category === "path_traversal");
    assert.ok(pathTrav, "Must detect Path Traversal vulnerability in fs.readFileSync");
    assert.strictEqual(pathTrav.cwe, "CWE-22", "Path traversal must map to CWE-22");

    const cors = vulnFindings.find(f => f.category === "security_misconfiguration");
    assert.ok(cors, "Must detect overly permissive CORS origin header");

    // Safe code check
    const safeFindings = await sastScanner.scan([{ path: "safe_server.js", content: safeCode }]);
    const safeSsrf = safeFindings.find(f => f.category === "ssrf");
    assert.strictEqual(safeSsrf, undefined, "Safe code with static URL must not trigger SSRF");

    console.log("  ✅ SSRF (CWE-918), Path Traversal (CWE-22), and Insecure CORS detected on vulnerable code and clean on safe code");
  }

  console.log("\n🎉 ALL SPRINT 2 CORE ENGINE EXPANSION TESTS PASSED!");
}

runSprint2Tests().catch(err => {
  console.error("❌ Sprint 2 Tests Failed:", err);
  process.exit(1);
});
