const RiskCorrelationEngine = require('../../backend/src/analysis/risk/correlation');
const ProductionReadinessModel = require('../../backend/src/analysis/risk/readiness');

function testCorrelation() {
  console.log('Testing Risk Correlation Engine...');
  const engine = new RiskCorrelationEngine();
  const readiness = new ProductionReadinessModel();

  // Mock Findings
  const findings = [
    {
      file: 'src/users.js',
      line: 42,
      category: 'sql_injection',
      severity: 'Critical',
      scanner: 'CustomRuleScanner',
      confidence: 0.8,
      title: 'SQL Injection 1'
    },
    {
      file: 'src/users.js',
      line: 44,
      category: 'sql_injection',
      severity: 'Critical',
      scanner: 'SemgrepScanner',
      confidence: 0.7,
      title: 'SQL Injection 2'
    },
    {
      file: 'src/auth.js',
      line: 10,
      category: 'authentication_weakness',
      severity: 'High',
      scanner: 'CustomRuleScanner',
      confidence: 0.1,
      title: 'False Positive Hash'
    }
  ];

  const correlated = engine.correlate(findings);
  
  if (correlated.length !== 1) {
    console.error('FAIL: Expected 1 correlated finding, got ' + correlated.length);
  } else {
    const finding = correlated[0];
    if (finding.scanner.includes('CustomRuleScanner') && finding.scanner.includes('SemgrepScanner')) {
      console.log('PASS: Correlation Engine correctly merged findings. (Confidence boosted to ' + finding.confidence.toFixed(2) + ', Band: ' + finding.confidence_band + ')');
    } else {
      console.error('FAIL: Merged finding does not list both scanners: ' + finding.scanner);
    }
  }

  console.log('\nTesting Production Readiness Model...');
  const scoreResult = readiness.evaluate(correlated, { fileCount: 10 });
  
  if (scoreResult.verdict === 'BLOCK') {
    console.log('PASS: Readiness correctly blocked due to Critical SQLi (Score: ' + scoreResult.overallScore + ')');
  } else {
    console.error('FAIL: Readiness returned ' + scoreResult.verdict + ' instead of BLOCK');
  }
}

testCorrelation();
