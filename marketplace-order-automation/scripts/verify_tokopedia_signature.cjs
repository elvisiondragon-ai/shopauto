const crypto = require('crypto');

/**
 * Verifies a Tokopedia webhook signature (hypothetical, based on common HMAC patterns).
 * Note: Tokopedia primarily uses IP whitelisting, but some financial hooks use signatures.
 * @param {string} secret - The shared secret.
 * @param {string} body - The raw request body.
 * @param {string} signature - The signature from headers.
 * @returns {boolean} - True if valid.
 */
function verifyTokopediaSignature(secret, body, signature) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const calculatedSignature = hmac.digest('hex');
  return calculatedSignature === signature;
}

module.exports = { verifyTokopediaSignature };
