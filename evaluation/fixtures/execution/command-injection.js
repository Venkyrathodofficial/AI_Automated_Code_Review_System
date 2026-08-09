const child_process = require('child_process');

function runUserScript(req, res) {
  const scriptName = req.query.script;
  // Vulnerable to Command Injection
  child_process.exec('sh ' + scriptName, (err, stdout) => {
    res.send(stdout);
  });
}
