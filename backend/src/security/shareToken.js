/**
 * Share Token Utility
 * Generates and validates cryptographic HMAC tokens for sharing security reports safely.
 */

const crypto = require("crypto");
const { getEncryptionKey } = require("./tokenCipher");

/**
 * Generates an HMAC-SHA256 signature for a scan ID.
 * @param {string} scanId - UUID of the scan
 * @returns {string} 32-character hexadecimal token
 */
function generateShareToken(scanId) {
  if (!scanId) return "";
  return crypto
    .createHmac("sha256", getEncryptionKey())
    .update(String(scanId))
    .digest("hex")
    .slice(0, 32);
}

/**
 * Validates a share token for a given scan ID.
 * Uses timingSafeEqual to prevent timing attacks.
 * @param {string} scanId - UUID of the scan
 * @param {string} token - Token passed by caller
 * @returns {boolean} True if token is valid
 */
function verifyShareToken(scanId, token) {
  if (!scanId || !token || typeof token !== "string") return false;
  const expected = generateShareToken(scanId);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

module.exports = {
  generateShareToken,
  verifyShareToken,
};
