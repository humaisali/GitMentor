import Analytics from '../models/Analytics.js';
import BuildSession from '../models/BuildSession.js';
import Insight from '../models/Insight.js';
import OAuthState from '../models/OAuthState.js';
import Project from '../models/Project.js';
import Repository from '../models/Repository.js';
import SkillProfile from '../models/SkillProfile.js';
import SkillProgressEvent from '../models/SkillProgressEvent.js';
import User from '../models/User.js';
import { createOAuthClient } from '../services/googleCalendarService.js';
import { decryptToken } from '../utils/tokenCrypto.js';
import { normalizeUserPreferences } from '../utils/userSettings.js';

const getOwnedData = async userId => {
  const [repositories, projects, buildSessions, skillProfile, progressEvents, analytics] = await Promise.all([
    Repository.find({ user: userId }).lean(),
    Project.find({ user: userId }).sort({ order: 1 }).lean(),
    BuildSession.find({ user: userId }).sort({ startAt: 1 }).lean(),
    SkillProfile.findOne({ user: userId }).lean(),
    SkillProgressEvent.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    Analytics.findOne({ user: userId }).lean(),
  ]);
  return { repositories, projects, buildSessions, skillProfile, progressEvents, analytics };
};

const buildSettingsResponse = async user => {
  const preferences = normalizeUserPreferences(user.preferences?.toObject?.() || user.preferences || {});
  const [trackedRepositoryCount, projectCount, buildSessionCount, skillProfile] = await Promise.all([
    Repository.countDocuments({ user: user._id }),
    Project.countDocuments({ user: user._id }),
    BuildSession.countDocuments({ user: user._id }),
    SkillProfile.findOne({ user: user._id }).select('targetRole overallScore overallLevel repositoriesAnalyzed assessedAt'),
  ]);
  const hasGoogleToken = Boolean(user.googleCalendar?.refreshToken || user.googleRefreshToken);
  let calendarStatus = user.googleCalendar?.status || (hasGoogleToken ? 'CONNECTED' : 'DISCONNECTED');
  if (hasGoogleToken && calendarStatus === 'DISCONNECTED') calendarStatus = 'CONNECTED';

  return {
    profile: {
      id: user._id,
      githubId: user.githubId,
      username: user.username,
      avatarUrl: user.avatarUrl || '',
      memberSince: user.createdAt,
    },
    preferences,
    integrations: {
      github: {
        connected: Boolean(user.accessToken),
        cachedRepositoryCount: Array.isArray(user.githubReposCache) ? user.githubReposCache.length : 0,
        trackedRepositoryCount,
        lastRefreshedAt: user.githubCacheUpdatedAt || null,
      },
      googleCalendar: {
        connected: hasGoogleToken && calendarStatus !== 'RECONNECT_REQUIRED',
        email: user.googleCalendar?.email || '',
        status: calendarStatus,
        connectedAt: user.googleCalendar?.connectedAt || null,
        lastValidatedAt: user.googleCalendar?.lastValidatedAt || null,
        scopes: user.googleCalendar?.scopes || [],
      },
    },
    skillEngine: skillProfile ? {
      targetRole: skillProfile.targetRole,
      overallScore: skillProfile.overallScore,
      overallLevel: skillProfile.overallLevel,
      repositoriesAnalyzed: skillProfile.repositoriesAnalyzed,
      assessedAt: skillProfile.assessedAt,
      assessmentOutOfDate: skillProfile.targetRole !== preferences.skillEngine.targetRole,
    } : null,
    dataSummary: {
      trackedRepositories: trackedRepositoryCount,
      projects: projectCount,
      buildSessions: buildSessionCount,
      hasSkillProfile: Boolean(skillProfile),
    },
  };
};

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(await buildSettingsResponse(user));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || 'Unable to load settings.' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const incoming = req.body?.preferences || req.body || {};
    const preferences = normalizeUserPreferences(user.preferences?.toObject?.() || user.preferences || {}, incoming);
    user.set('preferences', preferences);
    await user.save();
    return res.status(200).json(await buildSettingsResponse(user));
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Unable to update settings.',
      ...(error.issues ? { issues: error.issues } : {}),
    });
  }
};

export const exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const data = await getOwnedData(user._id);
    return res.status(200).json({
      exportedAt: new Date().toISOString(),
      account: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        avatarUrl: user.avatarUrl || '',
        createdAt: user.createdAt,
        preferences: normalizeUserPreferences(user.preferences?.toObject?.() || user.preferences || {}),
      },
      ...data,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to export account data.', error: error.message });
  }
};

export const logoutAllSessions = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    return res.status(200).json({ message: 'All GitMentor sessions have been signed out.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to sign out all sessions.', error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (String(req.body?.confirmation || '') !== user.username) {
      return res.status(400).json({ message: `Type ${user.username} to confirm account deletion.` });
    }

    const googleToken = user.googleCalendar?.refreshToken || user.googleRefreshToken;
    if (googleToken) {
      try {
        await createOAuthClient().revokeToken(decryptToken(googleToken));
      } catch (error) {
        console.warn(`Google token revocation failed during account deletion for ${user._id}: ${error.message}`);
      }
    }

    const repositoryIds = await Repository.find({ user: user._id }).distinct('_id');
    await Promise.all([
      Insight.deleteMany({ repository: { $in: repositoryIds } }),
      Analytics.deleteMany({ user: user._id }),
      BuildSession.deleteMany({ user: user._id }),
      OAuthState.deleteMany({ user: user._id }),
      Project.deleteMany({ user: user._id }),
      SkillProfile.deleteMany({ user: user._id }),
      SkillProgressEvent.deleteMany({ user: user._id }),
      Repository.deleteMany({ user: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });
    return res.status(200).json({ message: 'GitMentor account and owned data deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete account.', error: error.message });
  }
};
