const crypto = require('crypto');

/**
 * Verifies a TikTok Shop webhook signature.
 * @param {string} appSecret - Your app's secret key.
 * @param {string} appKey - Your app's key.
 * @param {string} timestamp - The timestamp from the request.
 * @param {string} body - The raw request body.
 * @param {string} signature - The signature from the Authorization header.
 * @returns {boolean} - True if the signature is valid.
 */
function verifyTikTokSignature(appSecret, appKey, timestamp, body, signature) {
  const baseString = appKey + timestamp + body;
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(baseString);
  const calculatedSignature = hmac.digest('hex');
  return calculatedSignature === signature;
}

// Example usage:
// const isValid = verifyTikTokSignature('secret', 'key', '123456789', '{"event":"ORDER_PAID"}', 'calculated_sig');
// console.log('Is valid:', isValid);

module.exports = { verifyTikTokSignature };
