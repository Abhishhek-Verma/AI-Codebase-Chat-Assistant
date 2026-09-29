/**
 * Auth Middleware
 * 
 * Verifies JWT access tokens and attaches authenticated user profile
 * to req.user.
 */

import { jwtService } from '../services/jwtService.js';
import { userStore } from '../services/userStore.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in or create an account.',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        error: 'Authentication token missing. Please sign in.',
        code: 'AUTH_REQUIRED',
      });
    }

    let decoded;
    try {
      decoded = jwtService.verifyAccessToken(token);
    } catch (err) {
      if (err.code === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          error: 'Session token expired. Please refresh your session.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        error: 'Invalid authentication token. Please sign in again.',
        code: 'INVALID_TOKEN',
      });
    }

    const user = userStore.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'User account not found. Please register or sign in again.',
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = userStore.sanitizeUser(user);
    next();
  } catch (error) {
    console.error('[authMiddleware] Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed. Please sign in again.' });
  }
}
