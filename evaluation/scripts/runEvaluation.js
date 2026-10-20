const fs = require('fs');
const path = require('path');
require('../../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const AnalysisOrchestrator = require('../../backend/src/analysis/orchestrator/index');

const FIXTURES_DIR = path.join(__dirname, '../fixtures');
const EXPECTED_DIR = path.join(__dirname, '../expected');
const RESULTS_DIR = path.join(__dirname, '../results');

async function runEvaluation() {
  console.log('Starting Sentinel V2.0 Validation Benchmark...');
  const categories = ['adversarial'];
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    falsePositives: 0,
    falseNegatives: 0,
    details: []
  };

  for (const category of categories) {
    const categoryPath = path.join(FIXTURES_DIR, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath);
    for (const file of files) {
      if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;

      const fixturePath = path.join(categoryPath, file);
      const fixtureContent = fs.readFileSync(fixturePath, 'utf8');
      const testId = file.split('.')[0];
      
      const expectedPath = path.join(EXPECTED_DIR, testId + '.json');
      let expected = null;
      if (fs.existsSync(expectedPath)) {
        expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
      } else {
        console.warn('WARNING: Missing ground truth for ' + testId);
        continue;
      }

      console.log('Evaluating [' + category + '] ' + file + '...');
      
      // Construct mock file for orchestrator
      const mockFiles = [{
        path: 'src/' + file,
        content: fixtureContent,
        size: Buffer.byteLength(fixtureContent, 'utf8')
      }];

      // Run Orchestrator
      const orchestrator = new AnalysisOrchestrator();
      const report = await orchestrator.runPipeline(mockFiles);

      // Evaluate Result
      const findings = report.findings;
      const detected = findings.length > 0;
      
      const detail = {
        id: expected.id,
        file: file,
        expectedDetection: expected.expected_detection,
        actualDetection: detected,
        findings: findings.map(f => ({ title: f.title, severity: f.severity, aiVerified: f.ai_verified })),
        success: false,
        errorType: null
      };

      if (expected.expected_detection && detected) {
        detail.success = true;
        results.passed++;
      } else if (!expected.expected_detection && !detected) {
        detail.success = true;
        results.passed++;
      } else if (expected.expected_detection && !detected) {
        detail.success = false;
        detail.errorType = 'FALSE_NEGATIVE';
        results.falseNegatives++;
        results.failed++;
      } else if (!expected.expected_detection && detected) {
        detail.success = false;
        detail.errorType = 'FALSE_POSITIVE';
        results.falsePositives++;
        results.failed++;
      }

      results.total++;
      results.details.push(detail);

      // Avoid API rate limits
      if (findings.length > 0) {
        console.log("Waiting 15 seconds to respect Gemini API rate limits...");
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
  }

  const resultPath = path.join(RESULTS_DIR, 'eval_' + Date.now() + '.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  
  console.log('\n==================================');
  console.log('EVALUATION COMPLETE');
  console.log('Total Run: ' + results.total);
  console.log('Passed:    ' + results.passed);
  console.log('Failed:    ' + results.failed);
  console.log('False Positives: ' + results.falsePositives);
  console.log('False Negatives: ' + results.falseNegatives);
  console.log('Results saved to: ' + resultPath);
  console.log('==================================\n');
}

runEvaluation().catch(console.error);
