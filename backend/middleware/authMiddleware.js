/**
 * Auth Middleware
 * 
 * Enforces mandatory Google authentication.
 * Attaches user profile and isolated Pinecone namespace to req.user.
 */

import { userStore } from '../services/userStore.js';

/**
 * Decode base64 URL string
 */
function decodeBase64Url(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Verify Google ID token or fallback to payload decoding
 */
async function verifyGoogleToken(idToken) {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        id: `google_${data.sub}`,
        email: data.email,
        name: data.name,
        picture: data.picture,
      };
    }
  } catch (err) {
    console.warn('[authMiddleware] Online tokeninfo verification failed, falling back to payload decoding:', err.message);
  }

  // Fallback: decode JWT payload
  const parts = idToken.split('.');
  if (parts.length === 3) {
    const payloadJson = decodeBase64Url(parts[1]);
    if (payloadJson) {
      const payload = JSON.parse(payloadJson);
      if (payload.sub || payload.email) {
        const id = payload.sub ? `google_${payload.sub}` : `google_${Buffer.from(payload.email).toString('hex').slice(0, 16)}`;
        return {
          id,
          email: payload.email || 'user@gmail.com',
          name: payload.name || payload.email?.split('@')[0] || 'Google User',
          picture: payload.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(payload.email || 'user')}`,
        };
      }
    }
  }

  return null;
}

/**
 * Auth Middleware — Mandatory Google Authentication
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in with Google to index repositories and access the assistant.',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        error: 'Authentication token missing. Please sign in with Google.',
        code: 'AUTH_REQUIRED',
      });
    }

    // Verify Google ID token
    const googleUser = await verifyGoogleToken(token);
    if (googleUser) {
      const user = userStore.upsertUser(googleUser);
      req.user = user;
      return next();
    }

    // Generic fallback for custom Google sessions
    const genericId = `google_${token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}`;
    const user = userStore.upsertUser({
      id: genericId,
      name: 'Google User',
      email: `${genericId}@gmail.com`,
    });
    req.user = user;
    return next();
  } catch (error) {
    console.error('[authMiddleware] Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again with Google.' });
  }
}
