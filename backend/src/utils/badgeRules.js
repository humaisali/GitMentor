export const BADGES = [
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Maintain a 10-day contribution streak on GitHub.',
    icon: 'Flame',
    color: 'text-orange-500'
  },
  {
    id: 'iron_coder',
    title: 'Iron Coder',
    description: 'Maintain a massive 30-day contribution streak.',
    icon: 'Shield',
    color: 'text-indigo-500'
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Reach 100 total contributions this year.',
    icon: 'Target',
    color: 'text-red-500'
  },
  {
    id: 'polyglot',
    title: 'Polyglot',
    description: 'Use 5 or more languages across your repositories.',
    icon: 'Code2',
    color: 'text-purple-500'
  },
  {
    id: 'star_gazer',
    title: 'Star Gazer',
    description: 'Earn 50 or more total stars across all your public repositories.',
    icon: 'Star',
    color: 'text-yellow-500'
  },
  {
    id: 'trend_setter',
    title: 'Trend Setter',
    description: 'Have a single repository with 50 or more stars.',
    icon: 'TrendingUp',
    color: 'text-teal-500'
  },
  {
    id: 'community_builder',
    title: 'Community Builder',
    description: 'Reach 20 or more followers on GitHub.',
    icon: 'Users',
    color: 'text-emerald-500'
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Follow 20 or more developers on GitHub.',
    icon: 'HeartHandshake',
    color: 'text-rose-500'
  },
  {
    id: 'open_source_contributor',
    title: 'Open Source Contributor',
    description: 'Create 10 or more Pull Requests.',
    icon: 'GitPullRequest',
    color: 'text-blue-500'
  },
  {
    id: 'issue_hunter',
    title: 'Issue Hunter',
    description: 'Create 10 or more Issues.',
    icon: 'Bug',
    color: 'text-green-500'
  },
  {
    id: 'fork_magnet',
    title: 'Fork Magnet',
    description: 'Accumulate 20 or more forks across your repositories.',
    icon: 'GitMerge',
    color: 'text-pink-500'
  },
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'Join and sync your GitHub account with GitMentor.',
    icon: 'Rocket',
    color: 'text-muted-cyan'
  }
];

export const evaluateBadges = (data, currentUnlockedIds) => {
  const newUnlocks = [];

  const check = (id, condition) => {
    if (!currentUnlockedIds.includes(id) && condition) {
      newUnlocks.push(id);
    }
  };

  check('early_adopter', true);
  check('streak_master', data.contributions.longestStreak >= 10);
  check('iron_coder', data.contributions.longestStreak >= 30);
  check('centurion', data.contributions.total >= 100);
  check('polyglot', data.languages && data.languages.length >= 5);
  check('star_gazer', data.overview.totalStars >= 50);
  check('trend_setter', data.trendingRepos && data.trendingRepos.length > 0 && data.trendingRepos[0].stargazerCount >= 50);
  check('community_builder', data.overview.followers >= 20);
  check('social_butterfly', data.overview.following >= 20);
  check('open_source_contributor', data.overview.pullRequests >= 10);
  check('issue_hunter', data.overview.issues >= 10);
  check('fork_magnet', data.overview.totalForks >= 20);

  return newUnlocks;
};
