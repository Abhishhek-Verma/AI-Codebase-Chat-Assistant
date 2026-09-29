
/**
 * JWT Service
 *
 * Issues and validates Access Tokens (short-lived) and Refresh Tokens (long-lived).
 */

import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'codebase_access_super_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'codebase_refresh_super_secret_key_2026';

const ACCESS_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '7d';

/**
 * Generate Access Token & Refresh Token pair
 */
export function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    namespace: user.namespace,
  };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

  return { accessToken, refreshToken };
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error('Access token expired');
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }
    const error = new Error('Invalid access token');
    error.code = 'INVALID_TOKEN';
    throw error;
  }
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.code = 'REFRESH_EXPIRED';
    throw error;
  }
}

export const jwtService = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
