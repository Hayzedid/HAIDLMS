import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  setupMfa,
  confirmMfa,
  disableMfa,
  createAdmin,
  listUsers,
  toggleUserStatus,
  sendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  createAdminSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  disableMfaSchema,
  mfaCodeSchema,
} from '../validators/auth.validators';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);

// Email verification
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

// Password reset
router.post('/forgot-password', validate(forgotPasswordSchema), requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// ── Authenticated ─────────────────────────────────────────────────────────
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

// MFA management
router.post('/mfa/setup', authenticate, setupMfa);
router.post('/mfa/confirm', authenticate, validate(mfaCodeSchema), confirmMfa);
router.post('/mfa/disable', authenticate, validate(disableMfaSchema), disableMfa);

// Email verification (resend)
router.post('/resend-verification', authenticate, sendVerificationEmail);

// ── Admin only ────────────────────────────────────────────────────────────
router.post('/admin/users', authenticate, authorize('admin'), validate(createAdminSchema), createAdmin);
router.get('/admin/users', authenticate, authorize('admin'), listUsers);
router.patch('/admin/users/:userId/toggle', authenticate, authorize('admin'), toggleUserStatus);

export default router;
