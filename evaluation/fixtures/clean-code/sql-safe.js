const db = require('db');

function getUser(req, res) {
  const userId = req.query.id;
  // Safe - uses parameterized query
  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [userId]);
}
