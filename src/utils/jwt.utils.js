const jwt = require('jsonwebtoken');

/**
 * Sign a JWT token
 * @param {object} payload - Data to encode in the token
 * @param {string} [secret=process.env.JWT_SECRET] - Secret key
 * @param {string} [expiresIn=process.env.JWT_EXPIRES_IN] - Expiration time
 * @returns {string} Signed JWT token
 */
const signToken = (payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} [secret=process.env.JWT_SECRET] - Secret key
 * @returns {object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

/**
 * Generate access + refresh token pair
 * @param {object} payload - Data to encode (must include id)
 * @returns {{ token: string, refreshToken: string }}
 */
const generateTokens = (payload) => {
  const token = signToken(
    { id: payload.id },
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRES_IN || '15m'
  );
  const refreshToken = signToken(
    { id: payload.id },
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  );
  return { token, refreshToken };
};

module.exports = {
  signToken,
  verifyToken,
  generateTokens,
};
