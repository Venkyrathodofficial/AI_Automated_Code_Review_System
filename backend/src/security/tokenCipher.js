/**
 * Token Cipher Utility
 * Provides AES-256-GCM authenticated encryption for sensitive tokens at rest.
 * Fully backward-compatible with existing unencrypted legacy tokens.
 */

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Derives a deterministic 32-byte key from environment secrets.
 */
function getEncryptionKey() {
  const secret =
    process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY ||
    "sentinel-default-encryption-salt-2026";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext secret string.
 * Format: enc:iv_hex:tag_hex:ciphertext_hex
 * If the string is already encrypted or falsy, returns it unchanged.
 */
function encryptToken(token) {
  if (!token || typeof token !== "string") return token;
  if (token.startsWith("enc:")) return token; // Already encrypted

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    return `enc:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("Token encryption failed:", err.message);
    return token; // Fallback to plaintext if encryption fails to prevent service outage
  }
}

/**
 * Decrypts a token encrypted with encryptToken.
 * Returns plaintext string. If not encrypted, returns as-is for backward compatibility.
 */
function decryptToken(encryptedToken) {
  if (!encryptedToken || typeof encryptedToken !== "string") return encryptedToken;
  if (!encryptedToken.startsWith("enc:")) return encryptedToken; // Plaintext legacy token

  try {
    const parts = encryptedToken.split(":");
    if (parts.length !== 4) return encryptedToken;

    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const ciphertext = parts[3];

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Token decryption failed:", err.message);
    return null;
  }
}

/**
 * Returns a masked representation of the token for logging or sanitized API responses.
 * E.g. ghp_1234...abcd
 */
function maskToken(token) {
  if (!token) return "";
  const plain = decryptToken(token) || "";
  if (plain.length <= 8) return "********";
  return `${plain.slice(0, 4)}...${plain.slice(-4)}`;
}

module.exports = {
  encryptToken,
  decryptToken,
  maskToken,
  getEncryptionKey,
};
