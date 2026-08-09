const fs = require('fs').promises;
const path = require('path');
const AnalysisOrchestrator = require('../src/analysis/orchestrator');

async function getFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(res, baseDir)));
    } else {
      const content = await fs.readFile(res, "utf-8");
      files.push({
        path: path.relative(baseDir, res).replace(/\\/g, "/"),
        content,
        size: content.length
      });
    }
  }
  return files;
}

async function runEvaluation() {
  console.log("=== Sentinel V2 Evaluation Engine ===");
  const fixturesDir = path.join(__dirname, 'fixtures');
  const expectedDir = path.join(__dirname, 'expected_results');

  const files = await getFiles(fixturesDir);
  console.log(`Loaded ${files.length} fixture files.`);

  const orchestrator = new AnalysisOrchestrator();
  const result = await orchestrator.runPipeline(files);

  console.log("\n--- Evaluation Results ---");
  console.log(`Total Findings: ${result.findings.length}`);
  
  // Basic validation check
  const sqlInjectionFound = result.findings.some(f => 
    f.file.includes('sql_injection.js') && 
    (f.title.toLowerCase().includes('sql') || f.description.toLowerCase().includes('sql'))
  );

  const secretsFound = result.findings.some(f => 
    f.file.includes('sql_injection.js') && 
    f.scanner === 'SecretsScanner'
  );

  console.log(`\nValidations:`);
  console.log(`- SQL Injection detected: ${sqlInjectionFound ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Hardcoded Secrets detected: ${secretsFound ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`\nReadiness Verdict: ${result.readiness?.verdict || 'N/A'}`);
}

runEvaluation().catch(console.error);
