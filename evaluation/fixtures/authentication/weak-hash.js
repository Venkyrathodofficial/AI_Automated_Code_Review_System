const crypto = require('crypto');

function hashPassword(password) {
  // Vulnerable to weak hashing algorithm
  const hash = crypto.createHash('md5').update(password).digest('hex');
  return hash;
}
