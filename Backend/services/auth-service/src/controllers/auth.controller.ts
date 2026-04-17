import { Request, Response } from 'express';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import pool from '../db/pool';
import redis from '../db/redis';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { User, RegisterBody, LoginBody } from '../types';
import { AuthRequest } from '../middleware/authenticate';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

// ── Register ──────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, role } = req.body as RegisterBody;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query<User>(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name, last_name, role, is_email_verified, created_at`,
    [email, passwordHash, firstName, lastName, role || 'student']
  );

  const user = result.rows[0];

  // TODO: send verification email via notification-service

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: { id: user.id, email: user.email, role: user.role },
  });
};

// ── Login ─────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, mfaCode } = req.body as LoginBody;

  const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user || !user.is_active) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  // Check account lock
  if (user.locked_until && new Date() < new Date(user.locked_until)) {
    res.status(423).json({ success: false, message: 'Account temporarily locked. Try again later.' });
    return;
  }

  // Verify password
  const valid = user.password_hash
    ? await comparePassword(password, user.password_hash)
    : false;

  if (!valid) {
    const attempts = user.failed_login_attempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await pool.query(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockedUntil, user.id]
      );
      res.status(423).json({ success: false, message: 'Account locked after too many failed attempts.' });
    } else {
      await pool.query(
        'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
        [attempts, user.id]
      );
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    return;
  }

  // MFA check
  if (user.mfa_enabled) {
    if (!mfaCode) {
      res.status(200).json({ success: true, mfaRequired: true });
      return;
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret!,
      encoding: 'base32',
      token: mfaCode,
      window: 1,
    });
    if (!verified) {
      res.status(401).json({ success: false, message: 'Invalid MFA code' });
      return;
    }
  }

  // Reset failed attempts
  await pool.query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
    [user.id]
  );

  // Enforce single active session — revoke existing refresh tokens
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false',
    [user.id]
  );

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store hashed refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, ip_address, expires_at) VALUES ($1, $2, $3, $4)',
    [user.id, tokenHash, req.ip, expiresAt]
  );

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        mfaEnabled: user.mfa_enabled,
      },
    },
  });
};

// ── Refresh Token ─────────────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const result = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()',
    [tokenHash]
  );

  if (result.rows.length === 0) {
    res.status(401).json({ success: false, message: 'Refresh token expired or revoked' });
    return;
  }

  // Rotate: revoke old, issue new
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash]);

  const newAccessToken = signAccessToken({ userId: payload.userId, email: payload.email, role: payload.role });
  const newRefreshToken = signRefreshToken({ userId: payload.userId, email: payload.email, role: payload.role });

  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [payload.userId, newHash, expiresAt]
  );

  res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
};

// ── Logout ────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash]);
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

// ── Get current user ──────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query<User>(
    'SELECT id, email, first_name, last_name, role, avatar_url, is_email_verified, mfa_enabled, created_at FROM users WHERE id = $1',
    [req.user!.userId]
  );
  const user = result.rows[0];
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      isEmailVerified: user.is_email_verified,
      mfaEnabled: user.mfa_enabled,
    },
  });
};

// ── Setup MFA ─────────────────────────────────────────────────────────────
export const setupMfa = async (req: AuthRequest, res: Response): Promise<void> => {
  const secret = speakeasy.generateSecret({ name: `TechLearn (${req.user!.email})` });
  // Store secret temporarily in Redis until user confirms
  await redis.setex(`mfa_setup:${req.user!.userId}`, 600, secret.base32);
  res.json({ success: true, data: { otpauthUrl: secret.otpauth_url, secret: secret.base32 } });
};

export const confirmMfa = async (req: AuthRequest, res: Response): Promise<void> => {
  const { code } = req.body;
  const secret = await redis.get(`mfa_setup:${req.user!.userId}`);
  if (!secret) {
    res.status(400).json({ success: false, message: 'MFA setup session expired' });
    return;
  }
  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });
  if (!verified) {
    res.status(400).json({ success: false, message: 'Invalid code' });
    return;
  }
  await pool.query(
    'UPDATE users SET mfa_secret = $1, mfa_enabled = true WHERE id = $2',
    [secret, req.user!.userId]
  );
  await redis.del(`mfa_setup:${req.user!.userId}`);
  res.json({ success: true, message: 'MFA enabled successfully' });
};

// ── Admin: create admin user ──────────────────────────────────────────────
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, email, role`,
    [email, passwordHash, firstName, lastName]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

// ── Admin: list all users ─────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), offset);

  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, is_active, is_email_verified, created_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users ${where}`,
    conditions.length ? params.slice(0, -2) : []
  );

  res.json({
    success: true,
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: Number(page),
    limit: Number(limit),
  });
};

// ── Admin: toggle user active status ─────────────────────────────────────
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const result = await pool.query(
    'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, is_active',
    [userId]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: result.rows[0] });
};

// ── Email Verification ────────────────────────────────────────────────────
export const sendVerificationEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const user = await pool.query<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user.rows[0]) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (user.rows[0].is_email_verified) {
    res.status(400).json({ success: false, message: 'Email already verified' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await pool.query(
    'INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  // TODO: Send email via notification service (Kafka event)
  // For now, return token in response for testing
  console.log(`[auth-service] Verification token for ${user.rows[0].email}: ${token}`);

  res.json({
    success: true,
    message: 'Verification email sent',
    // Remove this in production:
    data: { verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}` },
  });
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  const result = await pool.query(
    'SELECT * FROM email_verifications WHERE token = $1 AND used = false AND expires_at > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    return;
  }

  const verification = result.rows[0];

  await pool.query('UPDATE users SET is_email_verified = true WHERE id = $1', [verification.user_id]);
  await pool.query('UPDATE email_verifications SET used = true WHERE id = $1', [verification.id]);

  res.json({ success: true, message: 'Email verified successfully' });
};

// ── Password Reset ────────────────────────────────────────────────────────
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const result = await pool.query<User>('SELECT id FROM users WHERE email = $1', [email]);

  // Always return success to prevent email enumeration
  if (result.rows.length === 0) {
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    return;
  }

  const userId = result.rows[0].id;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  // TODO: Send email via notification service
  console.log(`[auth-service] Password reset token for ${email}: ${token}`);

  res.json({
    success: true,
    message: 'If the email exists, a reset link has been sent',
    // Remove this in production:
    data: { resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}` },
  });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    return;
  }

  const reset = result.rows[0];
  const passwordHash = await hashPassword(password);

  await pool.query(
    'UPDATE users SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL WHERE id = $2',
    [passwordHash, reset.user_id]
  );
  await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [reset.id]);

  // Revoke all refresh tokens for security
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [reset.user_id]);

  res.json({ success: true, message: 'Password reset successfully' });
};

// ── Update Profile ────────────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { firstName, lastName, avatarUrl } = req.body;
  const userId = req.user!.userId;

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  if (firstName) {
    updates.push(`first_name = $${paramCount++}`);
    values.push(firstName);
  }
  if (lastName) {
    updates.push(`last_name = $${paramCount++}`);
    values.push(lastName);
  }
  if (avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramCount++}`);
    values.push(avatarUrl);
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, message: 'No fields to update' });
    return;
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await pool.query<User>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
     RETURNING id, email, first_name, last_name, avatar_url, role`,
    values
  );

  res.json({ success: true, data: result.rows[0] });
};

// ── Change Password ───────────────────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  const result = await pool.query<User>('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  if (!user?.password_hash) {
    res.status(400).json({ success: false, message: 'Cannot change password for OAuth-only accounts' });
    return;
  }

  const valid = await comparePassword(currentPassword, user.password_hash);
  if (!valid) {
    res.status(401).json({ success: false, message: 'Current password is incorrect' });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

  // Revoke all refresh tokens except current session
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false',
    [userId]
  );

  res.json({ success: true, message: 'Password changed successfully' });
};

// ── Disable MFA ───────────────────────────────────────────────────────────
export const disableMfa = async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  const userId = req.user!.userId;

  const result = await pool.query<User>('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  if (user?.password_hash) {
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Password is incorrect' });
      return;
    }
  }

  await pool.query(
    'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
    [userId]
  );

  res.json({ success: true, message: 'MFA disabled successfully' });
};
