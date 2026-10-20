const PRVerifier = require('../../backend/src/analysis/github/prVerifier');

function testPRComment() {
  console.log('Testing PRVerifier Comment Generation...');
  const verifier = new PRVerifier();

  const mockPipelineResult = {
    state: 'COMPLETED',
    readiness: {
      verdict: 'BLOCK',
      overallScore: 45,
      categoryScores: {
        security: 30,
        reliability: 80
      }
    },
    findings: [
      { title: 'Hardcoded Password', file: 'auth.js', line: 12, severity: 'Critical', cwe: 'CWE-259' },
      { title: 'Debug Mode Enabled', file: 'config.js', severity: 'Medium' }
    ]
  };

  const comment = verifier.generatePRComment(mockPipelineResult, 'CodeAurora/Sentinel');
  console.log('--- GENERATED COMMENT ---');
  console.log(comment);
  console.log('-------------------------');
  
  if (comment.includes('🚫') && comment.includes('BLOCK') && comment.includes('Hardcoded Password') && comment.includes('CWE-259')) {
    console.log('PASS: PR Comment generation successfully formats the verdict, score, and findings.');
  } else {
    console.error('FAIL: PR Comment generation missing expected fields.');
  }
}

testPRComment();
