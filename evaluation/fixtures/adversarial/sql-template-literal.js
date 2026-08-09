const db = require('db');

function getUser(req, res) {
  const userId = req.query.id;
  // Vulnerable to SQL Injection via template literal, which bypasses the + regex
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.execute(query);
}
