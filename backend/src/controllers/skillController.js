import SkillProfile from '../models/SkillProfile.js';
import User from '../models/User.js';
import Repository from '../models/Repository.js';
import { generateSkillAssessment } from '../utils/geminiApi.js';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

/**
 * Build a GraphQL query that fetches all the data needed for skill assessment.
 * Returns languages, contributions, repos, and social stats.
 */
const buildAssessmentQuery = () => `
  query {
    viewer {
      followers { totalCount }
      following { totalCount }
      pullRequests { totalCount }
      issues { totalCount }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
        nodes {
          name
          description
          url
          stargazerCount
          forkCount
          primaryLanguage { name color }
          languages(first: 10) {
            edges {
              size
              node { name color }
            }
          }
        }
      }
    }
  }
`;

/**
 * Process raw GitHub GraphQL data into the format expected by the AI.
 */
const processGitHubData = (viewer) => {
  const calendar = viewer.contributionsCollection.contributionCalendar;

  // Compute streaks
  const days = calendar.weeks.flatMap(w => w.contributionDays);
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) {
      currentStreak++;
    } else if (i < days.length - 1) {
      break;
    }
  }

  // Process languages
  const languageMap = {};
  let totalSize = 0;
  let totalStars = 0;
  let totalForks = 0;

  viewer.repositories.nodes.forEach(repo => {
    totalStars += repo.stargazerCount;
    totalForks += repo.forkCount;
    repo.languages.edges.forEach(edge => {
      const { size, node: { name, color } } = edge;
      if (!languageMap[name]) {
        languageMap[name] = { name, color, size: 0 };
      }
      languageMap[name].size += size;
      totalSize += size;
    });
  });

  const languages = Object.values(languageMap)
    .sort((a, b) => b.size - a.size)
    .slice(0, 8)
    .map(lang => ({
      ...lang,
      percentage: totalSize > 0 ? ((lang.size / totalSize) * 100).toFixed(1) : 0
    }));

  return {
    overview: {
      followers: viewer.followers.totalCount,
      following: viewer.following.totalCount,
      pullRequests: viewer.pullRequests.totalCount,
      issues: viewer.issues.totalCount,
      totalStars,
      totalForks,
    },
    contributions: {
      total: calendar.totalContributions,
      currentStreak,
      longestStreak,
    },
    languages,
    allRepos: viewer.repositories.nodes,
  };
};

// @desc    Get user's cached skill profile
// @route   GET /api/skills/profile
// @access  Private
export const getSkillProfile = async (req, res) => {
  try {
    const profile = await SkillProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: 'No skill profile found. Run an assessment first.' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching skill profile:', error);
    res.status(500).json({ message: 'Failed to fetch skill profile', error: error.message });
  }
};

// @desc    Trigger a new AI skill assessment
// @route   POST /api/skills/assess
// @access  Private
export const assessSkills = async (req, res) => {
  try {
    // 1. Get user and verify access token
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({ message: 'GitHub access token not found. Please re-authenticate.' });
    }

    // 2. Fetch GitHub data via GraphQL
    const githubRes = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({ query: buildAssessmentQuery() }),
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      throw new Error(`GitHub API Error: ${githubRes.status} ${errorText}`);
    }

    const { data, errors } = await githubRes.json();
    if (errors) {
      throw new Error(`GraphQL Error: ${errors.map(e => e.message).join(', ')}`);
    }

    // 3. Process GitHub data
    const analyticsData = processGitHubData(data.viewer);

    // 4. Fetch tracked repos for additional context
    const trackedRepos = await Repository.find({ user: req.user._id });

    // 5. Generate AI assessment
    const assessment = await generateSkillAssessment(analyticsData, trackedRepos);

    // 6. Delete old profile and save new one (replace, don't keep history)
    await SkillProfile.deleteOne({ user: req.user._id });

    const profile = await SkillProfile.create({
      user: req.user._id,
      overallLevel: assessment.overallLevel,
      overallScore: Math.round(assessment.overallScore),
      summary: assessment.summary,
      categories: assessment.categories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        level: cat.level,
        score: Math.round(cat.score),
        description: cat.description,
        strengths: cat.strengths || [],
        gaps: cat.gaps || [],
      })),
      topLanguages: (assessment.topLanguages || []).map(lang => ({
        name: lang.name,
        proficiency: lang.proficiency,
        projectCount: lang.projectCount || 0,
      })),
      recommendations: assessment.recommendations || [],
      repositoriesAnalyzed: analyticsData.allRepos.length,
      assessedAt: new Date(),
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error('Error running skill assessment:', error);
    res.status(500).json({ message: 'Failed to run skill assessment', error: error.message });
  }
};

// @desc    Delete the existing skill profile
// @route   DELETE /api/skills/profile
// @access  Private
export const deleteSkillProfile = async (req, res) => {
  try {
    const result = await SkillProfile.deleteOne({ user: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No skill profile found to delete.' });
    }

    res.status(200).json({ message: 'Skill profile deleted successfully.' });
  } catch (error) {
    console.error('Error deleting skill profile:', error);
    res.status(500).json({ message: 'Failed to delete skill profile', error: error.message });
  }
};
