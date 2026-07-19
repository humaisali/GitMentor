// Utility for making authenticated requests to the GitHub REST API.

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Fetches the authenticated user's public repositories from GitHub.
 * @param {string} accessToken - The user's GitHub OAuth access token.
 * @returns {Promise<Array>} - A list of repository objects.
 */
export const fetchUserRepos = async (accessToken) => {
  const response = await fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=30&type=owner`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const repos = await response.json();

  // Return a clean, normalized shape
  return repos.map((repo) => ({
    githubRepoId: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description || '',
    language: repo.language || 'Unknown',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    lastPushed: repo.pushed_at,
    htmlUrl: repo.html_url,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
  }));
};

/**
 * Fetches deep context for a specific repository to feed to the AI.
 * Gets the README, top-level file structure, and recent commits.
 * @param {string} accessToken - User's GitHub token
 * @param {string} fullName - e.g., "user/repo"
 * @param {string} branch - The default branch
 */
export const fetchRepoContext = async (accessToken, fullName, branch = 'main') => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    // 1. Fetch README
    const readmeRes = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/readme`, { headers });
    let readme = 'No README found.';
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      readme = Buffer.from(readmeData.content, 'base64').toString('utf8');
    }

    // 2. Fetch Structure (Top Level)
    const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/git/trees/${branch}`, { headers });
    let structure = [];
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      structure = treeData.tree ? treeData.tree.map(t => `${t.type === 'tree' ? '📁' : '📄'} ${t.path}`) : [];
    }

    // 3. Fetch Recent Commits
    const commitsRes = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/commits?per_page=10`, { headers });
    let commits = [];
    if (commitsRes.ok) {
      const commitsData = await commitsRes.json();
      commits = commitsData.map(c => `- ${c.commit.message.split('\n')[0]} (${c.commit.author.name})`);
    }

    return { readme, structure, commits };
  } catch (error) {
    console.error(`Error fetching repo context for ${fullName}:`, error);
    throw error;
  }
};
