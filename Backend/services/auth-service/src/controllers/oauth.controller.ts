import { Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db/pool';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { User } from '../types';

interface OAuthProfile {
  provider: 'google' | 'github' | 'microsoft';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

// ── OAuth Callback Handler ────────────────────────────────────────────────
export const handleOAuthCallback = async (profile: OAuthProfile, req: Request, res: Response): Promise<void> => {
  try {
    // Check if OAuth account exists
    const oauthResult = await pool.query(
      'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_id = $2',
      [profile.provider, profile.providerId]
    );

    let userId: string;

    if (oauthResult.rows.length > 0) {
      // Existing OAuth account
      userId = oauthResult.rows[0].user_id;

      // Check if user is active
      const userCheck = await pool.query<User>('SELECT is_active FROM users WHERE id = $1', [userId]);
      if (!userCheck.rows[0]?.is_active) {
        res.status(403).json({ success: false, message: 'Account is deactivated' });
        return;
      }
    } else {
      // Check if email already exists (link accounts)
      const emailResult = await pool.query<User>('SELECT id FROM users WHERE email = $1', [profile.email]);

      if (emailResult.rows.length > 0) {
        // Link OAuth to existing account
        userId = emailResult.rows[0].id;

        await pool.query(
          'INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1, $2, $3)',
          [userId, profile.provider, profile.providerId]
        );
      } else {
        // Create new user
        const userResult = await pool.query<User>(
          `INSERT INTO users (email, first_name, last_name, avatar_url, is_email_verified, role)
           VALUES ($1, $2, $3, $4, true, 'student')
           RETURNING id`,
          [profile.email, profile.firstName, profile.lastName, profile.avatarUrl]
        );

        userId = userResult.rows[0].id;

        // Create OAuth account link
        await pool.query(
          'INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1, $2, $3)',
          [userId, profile.provider, profile.providerId]
        );
      }
    }

    // Fetch full user data
    const userResult = await pool.query<User>('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Enforce single active session
    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false',
      [userId]
    );

    // Generate tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, ip_address, expires_at) VALUES ($1, $2, $3, $4)',
      [userId, tokenHash, req.ip, expiresAt]
    );

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error('[auth-service] OAuth error:', error);
    res.status(500).json({ success: false, message: 'OAuth authentication failed' });
  }
};

// ── Google OAuth ──────────────────────────────────────────────────────────
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const googleUser = (req as any).user;
  if (!googleUser) {
    res.status(401).json({ success: false, message: 'Google authentication failed' });
    return;
  }

  const profile: OAuthProfile = {
    provider: 'google',
    providerId: googleUser.id,
    email: googleUser.emails[0].value,
    firstName: googleUser.name.givenName,
    lastName: googleUser.name.familyName,
    avatarUrl: googleUser.photos?.[0]?.value,
  };

  await handleOAuthCallback(profile, req, res);
};

// ── GitHub OAuth ──────────────────────────────────────────────────────────
export const githubCallback = async (req: Request, res: Response): Promise<void> => {
  const githubUser = (req as any).user;
  if (!githubUser) {
    res.status(401).json({ success: false, message: 'GitHub authentication failed' });
    return;
  }

  const [firstName, ...lastNameParts] = (githubUser.displayName || githubUser.username).split(' ');

  const profile: OAuthProfile = {
    provider: 'github',
    providerId: githubUser.id,
    email: githubUser.emails[0].value,
    firstName: firstName || githubUser.username,
    lastName: lastNameParts.join(' ') || 'User',
    avatarUrl: githubUser.photos?.[0]?.value,
  };

  await handleOAuthCallback(profile, req, res);
};

// ── Microsoft OAuth ───────────────────────────────────────────────────────
export const microsoftCallback = async (req: Request, res: Response): Promise<void> => {
  const microsoftUser = (req as any).user;
  if (!microsoftUser) {
    res.status(401).json({ success: false, message: 'Microsoft authentication failed' });
    return;
  }

  const profile: OAuthProfile = {
    provider: 'microsoft',
    providerId: microsoftUser.id,
    email: microsoftUser.emails[0].value,
    firstName: microsoftUser.name.givenName,
    lastName: microsoftUser.name.familyName,
    avatarUrl: microsoftUser.photos?.[0]?.value,
  };

  await handleOAuthCallback(profile, req, res);
};
