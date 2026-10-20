const express = require('express');
const app = express();
const { Client } = require('pg');

const client = new Client({
  user: 'admin',
  host: 'localhost',
  database: 'mydb',
  password: 'supersecretpassword123',
  port: 5432,
});
client.connect();

app.get('/users', async (req, res) => {
  const username = req.query.username;
  
  // Vulnerable to SQL Injection
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  
  try {
    const result = await client.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
