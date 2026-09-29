import { userStore } from '../services/userStore.js';

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
    console.warn('[authController] tokeninfo error, falling back to payload decode:', err.message);
  }

  const parts = idToken.split('.');
  if (parts.length === 3) {
    const payloadJson = decodeBase64Url(parts[1]);
    if (payloadJson) {
      const payload = JSON.parse(payloadJson);
      if (payload.sub) {
        return {
          id: `google_${payload.sub}`,
          email: payload.email || 'user@gmail.com',
          name: payload.name || 'Google User',
          picture: payload.picture || '',
        };
      }
    }
  }
  return null;
}

/**
 * POST /api/auth/google
 */
export async function googleLogin(req, res) {
  try {
    const { idToken, credential } = req.body;
    const token = idToken || credential;

    if (!token) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    const googleProfile = await verifyGoogleToken(token);
    if (!googleProfile) {
      return res.status(401).json({ error: 'Failed to verify Google token' });
    }

    const user = userStore.upsertUser(googleProfile);
    const repoData = userStore.getUserRepoData(user.id);

    res.json({
      token,
      user,
      ...repoData,
    });
  } catch (err) {
    console.error('[authController] googleLogin error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * POST /api/auth/demo
 */
export async function demoLogin(req, res) {
  try {
    const { demoType = 'candidate_reviewer' } = req.body;
    const demoProfiles = {
      candidate_reviewer: {
        id: 'demo_candidate_reviewer',
        name: 'Technical Interviewer',
        email: 'reviewer@enterprise.ai',
        picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=reviewer',
      },
      lead_dev: {
        id: 'demo_lead_dev',
        name: 'Abhishek Verma (Lead)',
        email: 'abhishek.verma@codebase.ai',
        picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=abhishek',
      },
      guest_developer: {
        id: 'demo_guest_developer',
        name: 'Guest Developer',
        email: 'guest.dev@codebase.ai',
        picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      },
    };

    const profile = demoProfiles[demoType] || demoProfiles.candidate_reviewer;
    const user = userStore.upsertUser(profile);
    const repoData = userStore.getUserRepoData(user.id);

    res.json({
      token: `demo_${demoType}`,
      user,
      ...repoData,
    });
  } catch (err) {
    console.error('[authController] demoLogin error:', err);
    res.status(500).json({ error: 'Demo authentication failed' });
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
