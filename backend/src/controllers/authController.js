import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { google } from 'googleapis';
import User from '../models/User.js';
import OAuthState from '../models/OAuthState.js';
import { encryptToken, decryptToken } from '../utils/tokenCrypto.js';
import {
  createOAuthClient,
  GOOGLE_CALENDAR_SCOPES,
  isGoogleCredentialError,
  verifyGoogleConnection,
} from '../services/googleCalendarService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gitmentor-dev-secret-key';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const safeReturnTo = (value) => (
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/settings'
);

const hashState = (state) => crypto.createHash('sha256').update(state).digest('hex');

// @desc    Redirect user to GitHub OAuth
// @route   GET /api/auth/github
// @access  Public
// (Handled by passport middleware in routes)

// @desc    GitHub OAuth callback handler
// @route   GET /api/auth/github/callback
// @access  Public
export const githubCallback = (req, res) => {
  // User is now authenticated and available on req.user
  const token = jwt.sign(
    { id: req.user._id, username: req.user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Redirect to frontend with the JWT token as a query parameter
  res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const hasGoogleToken = Boolean(req.user.googleCalendar?.refreshToken || req.user.googleRefreshToken);
    let googleStatus = req.user.googleCalendar?.status || (req.user.googleId ? 'CONNECTED' : 'DISCONNECTED');
    if (hasGoogleToken && googleStatus === 'DISCONNECTED') googleStatus = 'CONNECTED';
    res.status(200).json({
      _id: req.user._id,
      username: req.user.username,
      avatarUrl: req.user.avatarUrl,
      githubId: req.user.githubId,
      googleId: req.user.googleId,
      googleCalendar: {
        connected: hasGoogleToken && googleStatus !== 'RECONNECT_REQUIRED',
        email: req.user.googleCalendar?.email || '',
        status: googleStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

export const startGoogleConnection = async (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString('base64url');
    const returnTo = safeReturnTo(req.body?.returnTo);

    await OAuthState.create({
      stateHash: hashState(state),
      user: req.user._id,
      returnTo,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const auth = createOAuthClient();
    const authorizationUrl = auth.generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      prompt: 'consent select_account',
      scope: GOOGLE_CALENDAR_SCOPES,
      state,
    });

    res.status(200).json({ authorizationUrl });
  } catch (error) {
    res.status(500).json({ message: 'Unable to start Google connection.', error: error.message });
  }
};

export const googleCallback = async (req, res) => {
  const redirectWithError = (reason) => (
    res.redirect(`${CLIENT_URL}/settings?google=error&reason=${encodeURIComponent(reason)}`)
  );

  try {
    if (req.query.error) return redirectWithError(req.query.error);
    if (!req.query.code || !req.query.state) return redirectWithError('missing_callback_parameters');

    const stateRecord = await OAuthState.findOneAndDelete({
      stateHash: hashState(req.query.state),
      expiresAt: { $gt: new Date() },
    });
    if (!stateRecord) return redirectWithError('invalid_or_expired_state');

    const auth = createOAuthClient();
    const { tokens } = await auth.getToken(req.query.code);
    auth.setCredentials(tokens);

    const profileResponse = await google.oauth2({ version: 'v2', auth }).userinfo.get();
    const profile = profileResponse.data;
    const user = await User.findById(stateRecord.user);
    if (!user) return redirectWithError('user_not_found');

    const existingToken = user.googleCalendar?.refreshToken || user.googleRefreshToken;
    const refreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : existingToken;
    if (!refreshToken) return redirectWithError('refresh_token_not_returned');

    user.googleId = profile.id;
    user.googleCalendar = {
      email: profile.email || '',
      refreshToken,
      scopes: String(tokens.scope || '').split(' ').filter(Boolean),
      status: 'CONNECTED',
      connectedAt: new Date(),
      lastValidatedAt: new Date(),
    };
    user.googleRefreshToken = undefined;
    await user.save();

    return res.redirect(`${CLIENT_URL}${safeReturnTo(stateRecord.returnTo)}?google=connected`);
  } catch (error) {
    console.error('Google callback error:', error);
    return redirectWithError('token_exchange_failed');
  }
};

export const getGoogleStatus = async (req, res) => {
  const user = await User.findById(req.user._id);
  const hasToken = Boolean(user?.googleCalendar?.refreshToken || user?.googleRefreshToken);
  let status = user?.googleCalendar?.status || (hasToken ? 'CONNECTED' : 'DISCONNECTED');
  if (hasToken && status === 'DISCONNECTED') status = 'CONNECTED';
  const lastValidatedAt = user?.googleCalendar?.lastValidatedAt;
  const validationIsStale = !lastValidatedAt || Date.now() - new Date(lastValidatedAt).getTime() > 5 * 60 * 1000;
  if (hasToken && (req.query.verify === 'true' || validationIsStale)) {
    try {
      await verifyGoogleConnection(user);
      status = 'CONNECTED';
      user.googleCalendar.status = status;
      user.googleCalendar.lastValidatedAt = new Date();
      await user.save();
    } catch (error) {
      if (isGoogleCredentialError(error) || error.code === 'GOOGLE_RECONNECT_REQUIRED') {
        status = 'RECONNECT_REQUIRED';
        user.googleCalendar.status = status;
        await user.save();
      } else {
        return res.status(502).json({ message: 'Unable to verify Google Calendar.', error: error.message });
      }
    }
  }
  res.status(200).json({
    connected: hasToken && status !== 'RECONNECT_REQUIRED',
    email: user?.googleCalendar?.email || '',
    scopes: user?.googleCalendar?.scopes || [],
    status,
    connectedAt: user?.googleCalendar?.connectedAt || null,
    lastValidatedAt: user?.googleCalendar?.lastValidatedAt || null,
  });
};

export const disconnectGoogle = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const storedToken = user?.googleCalendar?.refreshToken || user?.googleRefreshToken;
    let revocationWarning = '';

    if (storedToken) {
      try {
        await createOAuthClient().revokeToken(decryptToken(storedToken));
      } catch (error) {
        // Local unlinking must still succeed when Google has already invalidated the
        // token or an older token can no longer be decrypted with the current key.
        revocationWarning = 'Google could not confirm remote token revocation. Review GitMentor under your Google Account permissions if you want to revoke it manually.';
        console.warn(`Google token revocation failed for user ${user._id}: ${error.message}`);
      }
    }

    await User.updateOne({ _id: user._id }, {
      $set: {
        'googleCalendar.email': '',
        'googleCalendar.scopes': [],
        'googleCalendar.status': 'DISCONNECTED',
      },
      $unset: {
        googleId: '',
        googleRefreshToken: '',
        'googleCalendar.refreshToken': '',
        'googleCalendar.connectedAt': '',
        'googleCalendar.lastValidatedAt': '',
      },
    });
    res.status(200).json({
      message: 'Google Calendar disconnected.',
      ...(revocationWarning ? { warning: revocationWarning } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to disconnect Google Calendar.', error: error.message });
  }
};
