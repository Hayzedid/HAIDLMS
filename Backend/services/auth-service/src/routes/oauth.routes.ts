import { Router } from 'express';
import passport from '../config/passport';
import { googleCallback, githubCallback, microsoftCallback } from '../controllers/oauth.controller';

const router = Router();

// ── Google OAuth ──────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  googleCallback
);

// ── GitHub OAuth ──────────────────────────────────────────────────────────
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  githubCallback
);

// ── Microsoft OAuth ───────────────────────────────────────────────────────
router.get(
  '/microsoft',
  passport.authenticate('microsoft', { session: false })
);

router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  microsoftCallback
);

export default router;
