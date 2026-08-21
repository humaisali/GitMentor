import SkillProfile from '../models/SkillProfile.js';
import User from '../models/User.js';
import Repository from '../models/Repository.js';
import Project from '../models/Project.js';
import Insight from '../models/Insight.js';
import SkillProgressEvent from '../models/SkillProgressEvent.js';
import { generateSkillAssessment } from '../utils/geminiApi.js';
import { buildSkillAssessmentSignals, levelFromScore, SKILL_TAXONOMY } from '../services/skillAnalysisService.js';

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

const clampScore = (value, fallback = 0) => {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const normalizeLevel = (level, score) => {
  const normalized = String(level || '').toUpperCase();
  if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(normalized)) return normalized;
  return levelFromScore(score);
};

const normalizeImpact = (impact) => {
  const normalized = String(impact || '').toUpperCase();
  return ['LOW', 'MEDIUM', 'HIGH'].includes(normalized) ? normalized : 'MEDIUM';
};

const normalizeCategory = (category, fallback) => {
  const score = clampScore(category?.score, fallback.score);
  return {
    name: fallback.name,
    slug: fallback.slug,
    level: normalizeLevel(category?.level, score),
    score,
    confidence: clampScore(category?.confidence, fallback.confidence),
    description: category?.description || fallback.description,
    strengths: Array.isArray(category?.strengths) && category.strengths.length > 0
      ? category.strengths.slice(0, 6)
      : fallback.strengths || [],
    gaps: Array.isArray(category?.gaps) && category.gaps.length > 0
      ? category.gaps.slice(0, 6)
      : fallback.gaps || [],
    evidence: Array.isArray(category?.evidence) && category.evidence.length > 0
      ? category.evidence.slice(0, 6).map(item => ({
        source: item.source || 'ai',
        label: item.label || fallback.name,
        detail: item.detail || 'AI-refined assessment signal',
        weight: Number.isFinite(Number(item.weight)) ? Number(item.weight) : 1,
      }))
      : fallback.evidence || [],
    recommendedActions: Array.isArray(category?.recommendedActions) && category.recommendedActions.length > 0
      ? category.recommendedActions.slice(0, 4)
      : fallback.recommendedActions || [],
  };
};

const buildHistorySnapshot = (profile) => ({
  assessedAt: profile.assessedAt || profile.updatedAt || new Date(),
  overallScore: profile.overallScore,
  overallLevel: profile.overallLevel,
  confidence: profile.confidence,
  categoryScores: (profile.categories || []).map(category => ({
    slug: category.slug,
    score: category.score,
  })),
});

const mergeAssessmentWithSignals = (assessment, signals, previousProfile) => {
  const categoriesBySlug = new Map((assessment?.categories || []).map(category => [category.slug, category]));
  const fallbackBySlug = new Map((signals.categories || []).map(category => [category.slug, category]));

  const categories = SKILL_TAXONOMY.map(taxonomyItem => {
    const fallback = fallbackBySlug.get(taxonomyItem.slug) || {
      ...taxonomyItem,
      score: 20,
      confidence: 35,
      level: 'BEGINNER',
      description: `${taxonomyItem.name} needs more evidence.`,
      strengths: [],
      gaps: [`No clear ${taxonomyItem.name.toLowerCase()} evidence found yet`],
      evidence: [],
      recommendedActions: [],
    };
    return normalizeCategory(categoriesBySlug.get(taxonomyItem.slug), fallback);
  });

  const overallScore = clampScore(assessment?.overallScore, signals.overallScore);
  const history = previousProfile ? [
    ...(previousProfile.history || []).slice(-5),
    buildHistorySnapshot(previousProfile),
  ] : [];

  return {
    overallLevel: normalizeLevel(assessment?.overallLevel, overallScore),
    overallScore,
    confidence: clampScore(assessment?.confidence, signals.confidence),
    summary: assessment?.summary || 'GitMentor analyzed your GitHub activity, tracked repositories, and in-app progress to build this skill profile.',
    categories,
    topLanguages: (assessment?.topLanguages || []).length > 0 ? assessment.topLanguages.map(lang => ({
      name: lang.name,
      proficiency: normalizeLevel(lang.proficiency, 30),
      projectCount: Number.isFinite(Number(lang.projectCount)) ? Number(lang.projectCount) : 0,
    })) : [],
    recommendations: Array.isArray(assessment?.recommendations) && assessment.recommendations.length > 0
      ? assessment.recommendations.slice(0, 6)
      : signals.nextBestActions.map(action => action.description),
    nextBestActions: Array.isArray(assessment?.nextBestActions) && assessment.nextBestActions.length > 0
      ? assessment.nextBestActions.slice(0, 4).map(action => ({
        title: action.title || 'Improve a priority skill',
        description: action.description || 'Add stronger evidence through a real project change.',
        categorySlug: action.categorySlug || '',
        impact: normalizeImpact(action.impact),
      }))
      : signals.nextBestActions,
    repoSkillMap: signals.repoSkillMap,
    readinessScores: Array.isArray(assessment?.readinessScores) && assessment.readinessScores.length > 0
      ? assessment.readinessScores.slice(0, 4).map(item => ({
        track: item.track,
        score: clampScore(item.score, 0),
        summary: item.summary || '',
      }))
      : signals.readinessScores,
    recentProgressEvents: signals.recentProgressEvents || [],
    assessmentSignals: {
      projectStats: signals.projectStats,
      insightStats: signals.insightStats,
      progressEventStats: signals.progressEventStats,
      taxonomyVersion: '2026-08-21',
    },
    history,
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

    // 4. Fetch tracked repos, project progress, and resolved insights for additional context
    const trackedRepos = await Repository.find({ user: req.user._id });
    const projects = await Project.find({ user: req.user._id });
    const trackedRepoIds = trackedRepos.map(repo => repo._id);
    const insights = await Insight.find({ repository: { $in: trackedRepoIds } });
    const progressEvents = await SkillProgressEvent.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);

    // 5. Build deterministic rule-based evidence before asking AI to refine it
    const skillSignals = buildSkillAssessmentSignals({
      analyticsData,
      trackedRepos,
      projects,
      insights,
      progressEvents,
    });

    // 6. Generate AI assessment. If AI is unavailable, still return a useful rule-based profile.
    let assessment = null;
    try {
      assessment = await generateSkillAssessment(analyticsData, trackedRepos, skillSignals);
    } catch (aiError) {
      console.warn('Gemini skill refinement failed; using rule-based assessment:', aiError.message);
      assessment = {
        overallLevel: skillSignals.overallLevel,
        overallScore: skillSignals.overallScore,
        confidence: skillSignals.confidence,
        summary: 'GitMentor generated this profile from rule-based GitHub, repository, and project-progress signals. AI refinement was unavailable during this assessment.',
        categories: skillSignals.categories,
        topLanguages: analyticsData.languages.slice(0, 6).map(language => ({
          name: language.name,
          proficiency: levelFromScore(Number(language.percentage) >= 35 ? 70 : Number(language.percentage) >= 15 ? 50 : 30),
          projectCount: analyticsData.allRepos.filter(repo => (
            repo.primaryLanguage?.name === language.name ||
            (repo.languages?.edges || []).some(edge => edge.node?.name === language.name)
          )).length,
        })),
        recommendations: skillSignals.nextBestActions.map(action => action.description),
        nextBestActions: skillSignals.nextBestActions,
        readinessScores: skillSignals.readinessScores,
      };
    }
    const previousProfile = await SkillProfile.findOne({ user: req.user._id });
    const mergedAssessment = mergeAssessmentWithSignals(assessment, skillSignals, previousProfile);

    // 7. Replace the active profile while preserving assessment history
    await SkillProfile.deleteOne({ user: req.user._id });

    const profile = await SkillProfile.create({
      user: req.user._id,
      ...mergedAssessment,
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
