import express from 'express';
import passport from 'passport';
import {
  githubCallback,
  getMe,
  logout,
  startGoogleConnection,
  googleCallback,
  getGoogleStatus,
  disconnectGoogle,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @route   GET /api/auth/github
// Redirects user to GitHub OAuth consent screen
router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

// @route   GET /api/auth/github/callback
// GitHub redirects back here after user grants access
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`, session: false }),
  githubCallback
);

// @route   GET /api/auth/me
// Returns the currently authenticated user
router.get('/me', protect, getMe);

// @route   POST /api/auth/logout
router.post('/logout', protect, logout);

router.post('/google/connect', protect, startGoogleConnection);
router.get('/google/callback', googleCallback);
router.get('/google/status', protect, getGoogleStatus);
router.delete('/google/disconnect', protect, disconnectGoogle);

export default router;
