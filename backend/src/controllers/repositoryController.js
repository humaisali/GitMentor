import Repository from '../models/Repository.js';
import User from '../models/User.js';
import { fetchUserRepos } from '../utils/githubApi.js';

// @desc    Get user's repositories from GitHub (cached)
// @route   GET /api/repositories/github
// @access  Private
export const getGitHubRepos = async (req, res) => {
  try {
    // Fetch the full user document to get the access token
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({ message: 'GitHub access token not found. Please re-authenticate.' });
    }

    if (user.githubReposCache && user.githubReposCache.length > 0) {
      return res.status(200).json(user.githubReposCache);
    }

    const repos = await fetchUserRepos(user.accessToken);
    user.githubReposCache = repos;
    await user.save();
    res.status(200).json(repos);
  } catch (error) {
    console.error('GitHub API Error:', error.message);
    res.status(500).json({ message: 'Error fetching repositories from GitHub', error: error.message });
  }
};

// @desc    Force refresh user's repositories from GitHub
// @route   GET /api/repositories/github/refresh
// @access  Private
export const refreshGitHubRepos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({ message: 'GitHub access token not found. Please re-authenticate.' });
    }

    const repos = await fetchUserRepos(user.accessToken);
    user.githubReposCache = repos;
    await user.save();
    res.status(200).json(repos);
  } catch (error) {
    console.error('GitHub API Error:', error.message);
    res.status(500).json({ message: 'Error refreshing repositories from GitHub', error: error.message });
  }
};

// @desc    Track a GitHub repository in our database
// @route   POST /api/repositories/track
// @access  Private
export const trackRepository = async (req, res) => {
  try {
    const { githubRepoId, name, fullName, defaultBranch } = req.body;

    // Check if already tracked
    const existing = await Repository.findOne({ githubRepoId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Repository is already being tracked.' });
    }

    const repo = await Repository.create({
      user: req.user._id,
      githubRepoId,
      name,
      fullName,
      branch: defaultBranch || 'main',
      status: 'in-progress',
    });

    res.status(201).json(repo);
  } catch (error) {
    res.status(500).json({ message: 'Error tracking repository', error: error.message });
  }
};

// @desc    Get all tracked repositories for the logged-in user
// @route   GET /api/repositories/tracked
// @access  Private
export const getTrackedRepos = async (req, res) => {
  try {
    const repos = await Repository.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(repos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tracked repositories', error: error.message });
  }
};
