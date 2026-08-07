import Insight from '../models/Insight.js';
import Repository from '../models/Repository.js';
import User from '../models/User.js';
import { generateRepoInsights } from '../utils/geminiApi.js';
import { fetchRepoContext } from '../utils/githubApi.js';

// @desc    Get insights for a specific repository
// @route   GET /api/insights/:repoId
// @access  Private
export const getInsightsForRepo = async (req, res) => {
  try {
    const { repoId } = req.params;

    if (repoId === '000000000000000000000000') {
      return res.status(200).json([
        {
          _id: 'mock-ins-1',
          insightId: 'INS-891',
          type: 'VULNERABILITY',
          severity: 'error',
          title: 'Insecure Dependency in package.json',
          description: 'Found critical CVE in lodash version. Upgrade to 4.17.21 immediately.',
          suggestedSolution: 'Run `npm install lodash@4.17.21` to update to the patched version.',
          file: 'package.json',
          isResolved: false,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'mock-ins-2',
          insightId: 'INS-892',
          type: 'PERFORMANCE',
          severity: 'warning',
          title: 'Unoptimized React Re-renders',
          description: 'DashboardLayout is re-rendering on every route change. Implement React.memo.',
          suggestedSolution: 'Wrap the DashboardLayout component export with `React.memo(DashboardLayout)` to prevent unnecessary re-renders.',
          file: 'src/layouts/DashboardLayout.jsx',
          isResolved: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    }

    const insights = await Insight.find({ repository: repoId }).sort({ createdAt: -1 });

    if (insights.length === 0) {
      const repository = await Repository.findById(repoId);
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // Fetch user token for GitHub API
      const user = await User.findById(req.user._id);
      
      let context = {};
      try {
        if (user && user.accessToken) {
          context = await fetchRepoContext(user.accessToken, repository.fullName, repository.branch);
        }
      } catch (err) {
        console.warn("Failed to fetch deep context for repo:", repository.fullName);
      }

      // Generate AI Insights
      const aiInsights = await generateRepoInsights(repository, context);
      
      // Save to DB
      const savedInsights = [];
      for (const item of aiInsights) {
        const insight = new Insight({
          repository: repoId,
          insightId: item.insightId,
          type: item.type,
          severity: item.severity,
          title: item.title,
          description: item.description,
          suggestedSolution: item.suggestedSolution,
          file: item.file
        });
        savedInsights.push(await insight.save());
      }
      
      return res.status(200).json(savedInsights);
    }

    res.status(200).json(insights);
  } catch (error) {
    console.error('Error fetching/generating insights:', error);
    res.status(500).json({ message: 'Server Error fetching insights', error: error.message });
  }
};

// @desc    Mark an insight as resolved
// @route   PATCH /api/insights/:id/resolve
// @access  Private
export const resolveInsight = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, you might want to verify that the insight belongs to a repo
    // that the current user owns or tracks.

    const insight = await Insight.findById(id);

    if (!insight) {
      // Allow mock updates for demo purposes
      if (id.startsWith('mock-ins-')) {
        return res.status(200).json({ message: 'Mock insight resolved' });
      }
      return res.status(404).json({ message: 'Insight not found' });
    }

    insight.isResolved = true;
    await insight.save();

    res.status(200).json(insight);
  } catch (error) {
    console.error('Error resolving insight:', error);
    res.status(500).json({ message: 'Server Error resolving insight', error: error.message });
  }
};

// @desc    Get user's pending insights across all repos
// @route   GET /api/insights/user
// @access  Private
export const getUserInsights = async (req, res) => {
  try {
    const repos = await Repository.find({ user: req.user._id }).select('_id fullName');
    const repoIds = repos.map(r => r._id);

    const insights = await Insight.find({ 
      repository: { $in: repoIds }, 
      isResolved: false 
    }).sort({ createdAt: -1 }).limit(10).populate('repository', 'name fullName');

    res.status(200).json(insights);
  } catch (error) {
    console.error('Error fetching user insights:', error);
    res.status(500).json({ message: 'Server Error fetching user insights', error: error.message });
  }
};
