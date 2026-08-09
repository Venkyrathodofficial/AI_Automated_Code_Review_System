const FixValidator = require('../../backend/src/analysis/remediation/fixValidator');

async function runTests() {
  console.log('Testing FixValidator...');
  const validator = new FixValidator();

  const vulnerableSQL = `const db = require('db');
function getUser(req, res) {
  const query = 'SELECT * FROM users WHERE id = ' + req.query.id;
  db.execute(query);
}`;

  const secureSQL = `const db = require('db');
function getUser(req, res) {
  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [req.query.id]);
}`;

  const insecureFix = `const db = require('db');
function getUser(req, res) {
  const API_KEY = 'sk_live_12345678901234567890'; // Introduced a secret!
  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [req.query.id]);
}`;

  console.log('Test 1: Valid Fix');
  const result1 = await validator.validate(vulnerableSQL, secureSQL, 'user.js', 'sql_injection');
  console.log(result1.isValid ? 'PASS' : 'FAIL', '- Verdict:', result1.verdict);

  console.log('\nTest 2: Fix introduces new vulnerability');
  const result2 = await validator.validate(vulnerableSQL, insecureFix, 'user.js', 'sql_injection');
  console.log(!result2.isValid ? 'PASS' : 'FAIL', '- Verdict:', result2.verdict);
  if (result2.newIssuesIntroduced > 0) {
    console.log('  Caught new issue:', result2.newIssues[0].title);
  }
}

runTests();
