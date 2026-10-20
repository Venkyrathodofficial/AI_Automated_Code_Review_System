const assert = require('assert');
const AnalysisOrchestrator = require('../src/analysis/orchestrator');

async function runTests() {
  console.log("🏃 Running Orchestrator Unit Tests...\n");

  const orchestrator = new AnalysisOrchestrator();
  
  // Test 1: Empty files
  console.log("Test 1: Empty file list");
  const res1 = await orchestrator.runPipeline([]);
  assert.strictEqual(res1.findings.length, 0);
  assert.strictEqual(res1.state, "COMPLETED");
  console.log("✅ Passed");

  // Test 2: Hardcoded API Key detection
  console.log("Test 2: Hardcoded API Key detection");
  const testFile1 = {
    path: "config.js",
    content: `const API_KEY = "AKIAIOSFODNN7EXAMPLE";\nconsole.log(API_KEY);`,
    size: 60
  };
  
  const orchestrator2 = new AnalysisOrchestrator();
  const res2 = await orchestrator2.runPipeline([testFile1]);
  
  // The CustomRulesScanner or SecretsScanner should catch this
  assert.ok(res2.findings.length > 0, "Should detect AWS key");
  const secretFinding = res2.findings.find(f => f.category === 'api_key_exposure');
  assert.ok(secretFinding, "Should categorize as API key exposure");
  
  // Verify redaction worked in SecretsScanner
  assert.ok(!secretFinding.description.includes("AKIAIOSFODNN7EXAMPLE"), "Exact secret should be redacted from description");
  console.log("✅ Passed");

  // Test 3: Readiness Score Calculation
  console.log("Test 3: Readiness Scoring");
  assert.ok(res2.readiness, "Readiness score should be calculated");
  // A Critical/High secret finding should BLOCK production readiness
  assert.strictEqual(res2.readiness.verdict, "BLOCK");
  console.log("✅ Passed");

  console.log("\n🎉 All orchestrator tests passed!");
}

runTests().catch(err => {
  console.error("❌ Tests failed:", err);
  process.exit(1);
});
