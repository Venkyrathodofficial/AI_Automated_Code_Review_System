/**
 * Sentinel Sprint 3 Test Suite:
 * Dynamic Architecture, Scanner Registry, Admin RBAC, Incident Lifecycle & Telemetry
 */

const test = require("node:test");
const assert = require("node:assert");

const { RuleRegistry } = require("../src/analysis/rules/ruleRegistry");
const { validateRule } = require("../src/analysis/rules/ruleSchema");
const CustomRulesScanner = require("../src/analysis/scanners/customRules");
const { ScannerRegistry } = require("../src/analysis/scanners/registry");
const { ROLES, hasPermission, isStaffRole, redactSensitiveData } = require("../src/security/rbac");
const { IncidentService, VALID_TRANSITIONS } = require("../src/operations/incidentService");
const ExecutionTracker = require("../src/operations/executionTracker");

test("Sprint 3: Dynamic Rule Architecture & Safe Execution", async (t) => {
  console.log("\n🧪 Running Sprint 3: Dynamic Rule Architecture Tests...");

  const registry = new RuleRegistry();
  const scanner = new CustomRulesScanner({ registry });

  // 1. Register a new custom rule dynamically without modifying the scanner loop
  const newRuleDef = {
    id: "CUSTOM_JWT_EXPIRY_CHECK",
    version: "1.0.0",
    category: "authorization_risk",
    pattern: /jwt\.sign\s*\([^)]*expiresIn:\s*['"]0['"]/gi,
    severity: "High",
    confidence: 0.85,
    title: "Non-expiring or Zero-Expiry JWT Token",
    description: "Issuing JWT tokens without expiry or with zero duration poses severe replay risks.",
    suggestion: "Provide an explicit expiry duration such as '1h' or '7d'.",
    cwe: "CWE-613",
    owasp: "A01:2021-Broken Access Control"
  };

  const regResult = registry.registerRule(newRuleDef);
  assert.strictEqual(regResult.success, true, "New rule must be successfully registered");

  const testFile = [{
    path: "src/auth.js",
    content: "const token = jwt.sign(payload, secret, { expiresIn: '0' });"
  }];

  let findings = await scanner.scan(testFile);
  assert.strictEqual(findings.length, 1, "Must detect finding with dynamically registered rule");
  assert.strictEqual(findings[0].title, newRuleDef.title);
  assert.strictEqual(findings[0].confidence, 0.85, "Must use rule's specific confidence score");

  // 2. Disable the rule dynamically and verify scanner skips it
  registry.setRuleStatus("CUSTOM_JWT_EXPIRY_CHECK", false);
  findings = await scanner.scan(testFile);
  assert.strictEqual(findings.length, 0, "Disabled rule must not produce findings");

  // Re-enable and verify it works again
  registry.setRuleStatus("CUSTOM_JWT_EXPIRY_CHECK", true);
  findings = await scanner.scan(testFile);
  assert.strictEqual(findings.length, 1, "Re-enabled rule must detect vulnerabilities");

  // 3. Schema validation rejects malformed rules safely
  const malformedRule = {
    id: "invalid_id_with_lowercase",
    pattern: "not_a_regex",
    severity: "UnknownSeverity"
  };
  const validation = validateRule(malformedRule);
  assert.strictEqual(validation.valid, false, "Schema must reject malformed rule");
  assert.ok(validation.errors.length >= 3, "Schema must return detailed error list");

  // 4. Catastrophic ReDoS rejection
  const redosRule = {
    id: "REDOS_RULE",
    version: "1.0.0",
    category: "general_vulnerability",
    pattern: /(a+)+/g, // Classic nested quantifier ReDoS
    severity: "High",
    title: "ReDoS Rule",
    description: "ReDoS pattern",
    suggestion: "Fix regex"
  };
  const redosValidation = validateRule(redosRule);
  assert.strictEqual(redosValidation.valid, false, "Schema must reject dangerous ReDoS pattern");

  console.log("  ✅ Dynamic rule registration, toggling, schema validation, and ReDoS safety verified");
});

test("Sprint 3: Dynamic Scanner Registry & Runtime Availability", async (t) => {
  console.log("\n🧪 Running Sprint 3: Dynamic Scanner Registry Tests...");

  const registry = new ScannerRegistry();

  // Register in-process operational engine
  registry.register({
    id: "test-operational-engine",
    displayName: "Test SAST",
    version: "1.0.0",
    checkAvailability: async () => ({ available: true, status: "OPERATIONAL" })
  }, {
    scan: async () => []
  });

  // Register missing binary engine
  registry.register({
    id: "test-unavailable-engine",
    displayName: "Test External Binary",
    version: "1.0.0",
    checkAvailability: async () => ({
      available: false,
      status: "UNAVAILABLE",
      reason: "Binary not found in PATH"
    })
  }, {
    scan: async () => []
  });

  const statuses = await registry.checkAllAvailability();
  assert.strictEqual(statuses.length, 2, "Must return status for all registered engines");

  const opEngine = statuses.find(s => s.id === "test-operational-engine");
  assert.strictEqual(opEngine.available, true);
  assert.strictEqual(opEngine.status, "OPERATIONAL");

  const unavailEngine = statuses.find(s => s.id === "test-unavailable-engine");
  assert.strictEqual(unavailEngine.available, false);
  assert.strictEqual(unavailEngine.status, "UNAVAILABLE");
  assert.ok(unavailEngine.reason.includes("Binary not found"));

  console.log("  ✅ Scanner registry availability contracts and truthful runtime checks verified");
});

test("Sprint 3: RBAC Enforcement & Sensitive Data Redaction", (t) => {
  console.log("\n🧪 Running Sprint 3: RBAC & Redaction Tests...");

  // Platform owner permissions
  assert.strictEqual(hasPermission(ROLES.PLATFORM_OWNER, "admin:settings:write"), true);
  assert.strictEqual(hasPermission(ROLES.PLATFORM_OWNER, "admin:audit:read"), true);

  // Support agent permissions
  assert.strictEqual(hasPermission(ROLES.SUPPORT_AGENT, "admin:incidents:notes"), true);
  assert.strictEqual(hasPermission(ROLES.SUPPORT_AGENT, "admin:settings:write"), false);

  // Customer permissions
  assert.strictEqual(hasPermission(ROLES.CUSTOMER_MEMBER, "incidents:create"), true);
  assert.strictEqual(hasPermission(ROLES.CUSTOMER_MEMBER, "admin:audit:read"), false);

  // Staff check
  assert.strictEqual(isStaffRole(ROLES.PLATFORM_OWNER), true);
  assert.strictEqual(isStaffRole(ROLES.SUPPORT_AGENT), true);
  assert.strictEqual(isStaffRole(ROLES.CUSTOMER_MEMBER), false);

  // Sensitive data redaction
  const sensitivePayload = {
    user: "admin",
    github_token: "ghp_1234567890abcdef1234567890abcdef",
    api_key: "AIzaSySecretApiKey",
    config: {
      client_secret: "supersecretvalue",
      safeValue: "public-metadata"
    }
  };

  const redacted = redactSensitiveData(sensitivePayload);
  assert.strictEqual(redacted.user, "admin");
  assert.ok(redacted.github_token.includes("[REDACTED]"));
  assert.ok(redacted.api_key.includes("[REDACTED]"));
  assert.ok(redacted.config.client_secret.includes("[REDACTED]"));
  assert.strictEqual(redacted.config.safeValue, "public-metadata");

  console.log("  ✅ Role permissions, hierarchy boundaries, and secret redaction verified");
});

test("Sprint 3: Incident Lifecycle & State Transitions", (t) => {
  console.log("\n🧪 Running Sprint 3: Incident Management Tests...");

  const incidentService = new IncidentService(null);

  // 1. Concurrency-safe fallback reference pattern: INC-YYYY-XXXXXX
  const ref = incidentService.generateFallbackIncidentRef();
  const currentYear = new Date().getFullYear().toString();
  assert.match(ref, new RegExp(`^INC-${currentYear}-\\d{6}$`), "Incident ref must match INC-YYYY-XXXXXX");

  // 2. SLA Calculation
  const criticalSLA = incidentService.calculateSLADeadline("Critical");
  const hoursRemaining = (new Date(criticalSLA) - Date.now()) / (1000 * 60 * 60);
  assert.ok(hoursRemaining > 1.9 && hoursRemaining <= 2.05, "Critical SLA must be ~2 hours");

  // 3. Valid State Transitions
  assert.deepStrictEqual(VALID_TRANSITIONS["NEW"], ["ASSIGNED", "IN_PROGRESS", "RESOLVED"]);
  assert.deepStrictEqual(VALID_TRANSITIONS["RESOLVED"], ["REOPENED"]);
  assert.deepStrictEqual(VALID_TRANSITIONS["REOPENED"], ["ASSIGNED", "IN_PROGRESS", "RESOLVED"]);

  // 4. Invalid State Transitions
  assert.ok(!VALID_TRANSITIONS["NEW"].includes("REOPENED"), "NEW cannot transition directly to REOPENED");
  assert.ok(!VALID_TRANSITIONS["RESOLVED"].includes("IN_PROGRESS"), "RESOLVED cannot transition directly to IN_PROGRESS without REOPENED");

  console.log("  ✅ Incident references, SLA calculations, and valid/invalid transitions verified");
});

test("Sprint 3: Pipeline Execution Observability Tracker", async (t) => {
  console.log("\n🧪 Running Sprint 3: Execution Observability Tests...");

  const tracker = new ExecutionTracker(null);

  const exec = await tracker.startExecution({
    userId: "usr-test-123",
    executionType: "scan"
  });

  assert.ok(exec.id);
  assert.match(exec.execution_ref, /^EXEC-\d{4}-\d+/);
  assert.match(exec.correlation_id, /^corr-[a-f0-9]{16}$/);
  assert.strictEqual(exec.status, "RUNNING");

  const stage = await tracker.recordStage({
    executionId: exec.id,
    stageName: "SCANNING",
    status: "COMPLETED",
    durationMs: 42
  });

  assert.strictEqual(stage.stage_name, "SCANNING");
  assert.strictEqual(stage.duration_ms, 42);

  const completed = await tracker.completeExecution({
    executionId: exec.id,
    status: "COMPLETED",
    findingsCount: 3,
    scannerStatus: { CustomRules: { status: "COMPLETED", findings: 3 } }
  });

  assert.strictEqual(completed.status, "COMPLETED");
  assert.strictEqual(completed.findings_count, 3);

  console.log("  ✅ Execution tracking, correlation IDs, and stage duration recording verified");
});
