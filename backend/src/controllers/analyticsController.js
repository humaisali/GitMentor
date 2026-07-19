import User from '../models/User.js';
import Analytics from '../models/Analytics.js';
import { evaluateBadges } from '../utils/badgeRules.js';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const buildGraphQLQuery = () => `
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
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            forkCount
            primaryLanguage { name color }
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

const processAnalyticsData = (viewer) => {
  // 1. Process Calendar & Streaks
  const calendar = viewer.contributionsCollection.contributionCalendar;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Flatten days
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  
  // Longest streak
  for (const day of days) {
    if (day.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Current streak (working backwards from today)
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) {
      currentStreak++;
    } else if (i < days.length - 1) { // allow today to be 0 without breaking an existing streak from yesterday immediately if you check early
       // Actually, true GitHub streak logic breaks if yesterday was 0.
       if (i === days.length - 1 && days[i].contributionCount === 0) {
         // It's today, maybe they haven't committed yet. Let's check yesterday.
         continue;
       }
       break;
    }
  }

  // 2. Process Languages
  const languageMap = {};
  let totalSize = 0;
  let totalStars = 0;
  let totalForks = 0;

  viewer.repositories.nodes.forEach((repo) => {
    totalStars += repo.stargazerCount;
    totalForks += repo.forkCount;
    repo.languages.edges.forEach((edge) => {
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
    .slice(0, 5)
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
      weeks: calendar.weeks,
    },
    languages,
    featuredRepos: viewer.pinnedItems.nodes,
    trendingRepos: viewer.repositories.nodes.slice(0, 3), // Top 3 by stars
  };
};

export const getFullAnalytics = async (req, res) => {
  try {
    const forceRefresh = req.query.forceRefresh === 'true';

    // 1. Check Cache
    if (!forceRefresh) {
      const cached = await Analytics.findOne({ user: req.user._id });
      if (cached) {
        return res.status(200).json({ ...cached.data, unlockedAchievements: cached.unlockedAchievements || [] });
      }
    }

    // 2. Fetch from GitHub
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({ message: 'User GitHub token not found' });
    }

    const githubRes = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({ query: buildGraphQLQuery() }),
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      throw new Error(`GitHub API Error: ${githubRes.status} ${errorText}`);
    }

    const { data, errors } = await githubRes.json();
    if (errors) {
      throw new Error(`GraphQL Error: ${errors.map((e) => e.message).join(', ')}`);
    }

    // 3. Process Data
    const processedData = processAnalyticsData(data.viewer);

    // Evaluate Achievements
    let currentUnlocked = [];
    const existing = await Analytics.findOne({ user: req.user._id });
    if (existing && existing.unlockedAchievements) {
      currentUnlocked = existing.unlockedAchievements;
    }

    const currentUnlockedIds = currentUnlocked.map(a => a.badgeId);
    const newUnlocks = evaluateBadges(processedData, currentUnlockedIds);
    
    let updatedAchievements = [...currentUnlocked];
    newUnlocks.forEach(badgeId => {
      updatedAchievements.push({ badgeId, unlockedAt: new Date() });
    });

    // 4. Save to DB
    await Analytics.findOneAndUpdate(
      { user: req.user._id },
      { 
        data: processedData, 
        unlockedAchievements: updatedAchievements,
        lastFetched: Date.now() 
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ ...processedData, unlockedAchievements: updatedAchievements });
  } catch (error) {
    console.error('Error fetching full analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

export const getRecentEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({ message: 'User GitHub token not found' });
    }

    const githubRes = await fetch(`https://api.github.com/users/${user.username}/events/public`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${user.accessToken}`,
      },
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      throw new Error(`GitHub API Error: ${githubRes.status} ${errorText}`);
    }

    const events = await githubRes.json();
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({ message: 'Failed to fetch recent events', error: error.message });
  }
};
