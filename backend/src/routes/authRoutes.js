import express from 'express';
import passport from 'passport';
import { githubCallback, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @route   GET /api/auth/github
// Redirects user to GitHub OAuth consent screen
router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

// @route   GET /api/auth/github/callback
// GitHub redirects back here after user grants access
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login', session: false }),
  githubCallback
);

// @route   GET /api/auth/me
// Returns the currently authenticated user
router.get('/me', protect, getMe);

// @route   POST /api/auth/logout
router.post('/logout', protect, logout);

// @route   GET /api/auth/google
router.get('/google', (req, res, next) => {
  const token = req.query.token;
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
    accessType: 'offline',
    prompt: 'consent',
    state: token
  })(req, res, next);
});

// @route   GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/settings?error=google_auth_failed', session: false }),
  (req, res) => {
    res.redirect('http://localhost:5173/settings?google=connected');
  }
);

export default router;
