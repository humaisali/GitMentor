// Utility for making authenticated requests to the GitHub REST API.

const GITHUB_API_BASE = 'https://api.github.com';

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

const fetchRepoTextFile = async (headers, fullName, path, branch) => {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${fullName}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    { headers }
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.content) return null;

  return Buffer.from(data.content, 'base64').toString('utf8');
};

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

    // 2. Fetch Structure (Recursive)
    const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { headers });
    let structure = [];
    let rawTree = [];
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      rawTree = treeData.tree || [];
      structure = rawTree
        .slice(0, 250)
        .map(t => `${t.type === 'tree' ? 'dir' : 'file'} ${t.path}`);
    }

    const filePaths = rawTree.filter(item => item.type === 'blob').map(item => item.path);
    const packageJsonPath = filePaths.find(path => path === 'package.json');
    const packageJsonText = packageJsonPath ? await fetchRepoTextFile(headers, fullName, packageJsonPath, branch) : null;
    let packageJson = null;
    try {
      packageJson = packageJsonText ? JSON.parse(packageJsonText) : null;
    } catch {
      packageJson = null;
    }

    const workflows = filePaths.filter(path => path.startsWith('.github/workflows/'));
    const configFiles = filePaths.filter(path => (
      /(^|\/)(dockerfile|docker-compose\.ya?ml|render\.ya?ml|vercel\.json|netlify\.toml|eslint\.config\.js|\.eslintrc|tsconfig\.json|vite\.config\.js|next\.config\.js|jest\.config\.js|vitest\.config\.js)$/i.test(path) ||
      path.includes('/__tests__/') ||
      path.includes('/tests/') ||
      /\.test\.[jt]sx?$/.test(path) ||
      /\.spec\.[jt]sx?$/.test(path)
    ));

    // 3. Fetch Recent Commits
    const commitsRes = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/commits?per_page=10`, { headers });
    let commits = [];
    if (commitsRes.ok) {
      const commitsData = await commitsRes.json();
      commits = commitsData.map(c => `- ${c.commit.message.split('\n')[0]} (${c.commit.author.name})`);
    }

    return {
      readme,
      structure,
      commits,
      packageJson,
      workflows,
      configFiles,
      detectedFiles: filePaths.slice(0, 250),
    };
  } catch (error) {
    console.error(`Error fetching repo context for ${fullName}:`, error);
    throw error;
  }
};
