import { userStore } from '../services/userStore.js';
import { jwtService } from '../services/jwtService.js';

/**
 * POST /api/auth/signup
 * Register a new user with name, email, and password
 */
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existing = userStore.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Create user and hash password
    const user = await userStore.createUser({ name, email, password });

    // Generate JWT access & refresh tokens
    const { accessToken, refreshToken } = jwtService.generateTokens(user);
    userStore.updateRefreshToken(user.id, refreshToken);

    const safeUser = userStore.sanitizeUser(user);

    res.status(201).json({
      message: 'Account created successfully',
      user: safeUser,
      accessToken,
      refreshToken,
      repos: [],
      activeRepo: null,
    });
  } catch (err) {
    console.error('[authController] signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
}

/**
 * POST /api/auth/login
 * Authenticate existing user with email and password
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = userStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password. Please verify your credentials or sign up.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isValid = await userStore.validatePassword(user, password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid email or password. Please verify your credentials.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate fresh tokens
    const { accessToken, refreshToken } = jwtService.generateTokens(user);
    userStore.updateRefreshToken(user.id, refreshToken);

    const safeUser = userStore.sanitizeUser(user);
    const repoData = userStore.getUserRepoData(user.id);

    res.json({
      message: 'Signed in successfully',
      user: safeUser,
      accessToken,
      refreshToken,
      ...repoData,
    });
  } catch (err) {
    console.error('[authController] login error:', err);
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
}

/**
 * POST /api/auth/refresh
 * Exchange refresh token for a new access token
 */
export async function refreshTokenHandler(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwtService.verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        error: 'Invalid or expired refresh token. Please sign in again.',
        code: 'REFRESH_EXPIRED',
      });
    }

    const user = userStore.getUser(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        error: 'Refresh token has been revoked or is invalid. Please sign in again.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Issue new pair
    const tokens = jwtService.generateTokens(user);
    userStore.updateRefreshToken(user.id, tokens.refreshToken);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userStore.sanitizeUser(user),
    });
  } catch (err) {
    console.error('[authController] refreshToken error:', err);
    res.status(500).json({ error: 'Failed to refresh authentication session' });
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    if (req.user?.id) {
      userStore.clearRefreshToken(req.user.id);
    }
    res.json({ message: 'Signed out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/auth/me
 */
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repoData = userStore.getUserRepoData(req.user.id);
    res.json({
      user: req.user,
      namespace: req.user.namespace,
      ...repoData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
