const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

export const SKILL_TAXONOMY = [
  { slug: 'frontend', name: 'Frontend Development' },
  { slug: 'backend', name: 'Backend Development' },
  { slug: 'databases', name: 'Databases' },
  { slug: 'api-design', name: 'API Design' },
  { slug: 'auth-security', name: 'Authentication & Security' },
  { slug: 'testing', name: 'Testing' },
  { slug: 'deployment', name: 'Deployment' },
  { slug: 'architecture', name: 'Architecture' },
  { slug: 'devops', name: 'DevOps & CI/CD' },
  { slug: 'code-quality', name: 'Code Quality' },
  { slug: 'documentation', name: 'Documentation' },
  { slug: 'open-source', name: 'Open Source Collaboration' },
  { slug: 'product-thinking', name: 'Product Thinking' },
];

export const CAREER_TRACKS = [
  {
    id: 'frontend-developer',
    label: 'Frontend Developer',
    slugs: ['frontend', 'testing', 'deployment', 'documentation', 'product-thinking', 'code-quality'],
  },
  {
    id: 'backend-developer',
    label: 'Backend Developer',
    slugs: ['backend', 'api-design', 'databases', 'auth-security', 'testing', 'architecture'],
  },
  {
    id: 'full-stack-developer',
    label: 'Full-Stack Developer',
    slugs: ['frontend', 'backend', 'databases', 'api-design', 'auth-security', 'deployment', 'testing'],
  },
  {
    id: 'ai-app-developer',
    label: 'AI App Developer',
    slugs: ['frontend', 'backend', 'api-design', 'architecture', 'product-thinking', 'code-quality'],
  },
  {
    id: 'devops-beginner',
    label: 'DevOps Beginner',
    slugs: ['deployment', 'devops', 'backend', 'testing', 'documentation', 'architecture'],
  },
  {
    id: 'open-source-contributor',
    label: 'Open Source Contributor',
    slugs: ['open-source', 'documentation', 'code-quality', 'testing', 'architecture'],
  },
];

export const getCareerTrack = (targetRole = 'full-stack-developer') => (
  CAREER_TRACKS.find(track => track.id === targetRole) || CAREER_TRACKS[2]
);

const CATEGORY_RULES = {
  frontend: ['react', 'vite', 'next', 'vue', 'angular', 'svelte', 'tailwind', 'css', 'html', 'jsx', 'tsx', 'frontend', 'ui', 'dashboard'],
  backend: ['node', 'express', 'server', 'api', 'backend', 'django', 'flask', 'fastapi', 'spring', 'laravel'],
  databases: ['mongo', 'mongoose', 'postgres', 'mysql', 'sqlite', 'redis', 'database', 'db', 'prisma', 'sequelize'],
  'api-design': ['rest', 'graphql', 'api', 'endpoint', 'webhook', 'oauth', 'jwt', 'integration'],
  'auth-security': ['auth', 'oauth', 'jwt', 'passport', 'security', 'vulnerability', 'permission', 'session'],
  testing: ['test', 'jest', 'vitest', 'cypress', 'playwright', 'coverage', 'spec', 'qa'],
  deployment: ['deploy', 'vercel', 'render', 'netlify', 'railway', 'hosting', 'production', 'docker'],
  architecture: ['architecture', 'mvc', 'service', 'modular', 'scalable', 'system', 'design', 'workflow'],
  devops: ['docker', 'ci', 'cd', 'github actions', 'workflow', 'pipeline', 'yaml', 'container'],
  'code-quality': ['eslint', 'lint', 'refactor', 'clean', 'maintainability', 'review', 'quality'],
  documentation: ['readme', 'docs', 'documentation', 'guide', 'srs', 'markdown'],
  'open-source': ['pull request', 'issue', 'fork', 'contributor', 'open source', 'community'],
  'product-thinking': ['dashboard', 'analytics', 'roadmap', 'workspace', 'mentor', 'user', 'feature', 'product'],
};

const LANGUAGE_CATEGORY_MAP = {
  JavaScript: ['frontend', 'backend', 'api-design'],
  TypeScript: ['frontend', 'backend', 'architecture'],
  HTML: ['frontend'],
  CSS: ['frontend'],
  SCSS: ['frontend'],
  Python: ['backend', 'api-design'],
  Java: ['backend', 'architecture'],
  Go: ['backend', 'devops'],
  Ruby: ['backend'],
  PHP: ['backend'],
  Shell: ['devops'],
  Dockerfile: ['deployment', 'devops'],
};

export const levelFromScore = (score) => {
  if (score >= 70) return 'ADVANCED';
  if (score >= 40) return 'INTERMEDIATE';
  return 'BEGINNER';
};

const addEvidence = (bucket, slug, evidence) => {
  if (!bucket[slug]) bucket[slug] = [];
  const exists = bucket[slug].some(item => item.label === evidence.label && item.detail === evidence.detail);
  if (!exists) bucket[slug].push(evidence);
};

const normalizeText = (...parts) => parts.filter(Boolean).join(' ').toLowerCase();

const getRepoLanguages = (repo) => {
  const languages = new Set();
  if (repo.primaryLanguage?.name) languages.add(repo.primaryLanguage.name);
  if (repo.language && repo.language !== 'Unknown') languages.add(repo.language);
  (repo.languages?.edges || []).forEach(edge => {
    if (edge.node?.name) languages.add(edge.node.name);
  });
  return Array.from(languages);
};

const getPackageDependencies = (packageJson = null) => {
  if (!packageJson) return [];
  return Object.keys({
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  });
};

const detectContextSignals = (context = {}) => {
  const detectedSkills = new Set();
  const primaryCategories = new Set();
  const evidenceDetails = [];
  const files = context.detectedFiles || [];
  const structureText = normalizeText(...(context.structure || []), ...(context.configFiles || []));
  const readmeText = normalizeText(context.readme || '');
  const commitsText = normalizeText(...(context.commits || []));
  const dependencies = getPackageDependencies(context.packageJson);
  const dependencyText = normalizeText(...dependencies);

  const addSignal = (slug, skill, detail) => {
    primaryCategories.add(slug);
    detectedSkills.add(skill);
    evidenceDetails.push({ slug, skill, detail });
  };

  if (dependencies.some(dep => ['react', 'react-dom', 'next', 'vite', '@vitejs/plugin-react', 'tailwindcss'].includes(dep))) {
    addSignal('frontend', 'Modern frontend stack', 'Detected frontend dependencies in package.json');
  }
  if (dependencies.some(dep => ['express', 'fastify', 'koa', 'hono', 'apollo-server'].includes(dep))) {
    addSignal('backend', 'Node API framework', 'Detected backend framework dependency');
    addSignal('api-design', 'HTTP API design', 'Detected API server dependency');
  }
  if (dependencies.some(dep => ['mongoose', 'mongodb', 'prisma', 'sequelize', 'pg', 'mysql2', 'redis'].includes(dep))) {
    addSignal('databases', 'Database integration', 'Detected database dependency');
  }
  if (dependencies.some(dep => ['passport', 'jsonwebtoken', 'bcrypt', 'bcryptjs', 'helmet', 'express-session'].includes(dep))) {
    addSignal('auth-security', 'Authentication and security', 'Detected auth/security dependency');
  }
  if (dependencies.some(dep => ['jest', 'vitest', 'mocha', 'cypress', '@playwright/test', 'supertest'].includes(dep))) {
    addSignal('testing', 'Automated testing', 'Detected testing dependency');
  }
  if (dependencies.some(dep => ['eslint', 'prettier', 'typescript'].includes(dep))) {
    addSignal('code-quality', 'Code quality tooling', 'Detected linting, formatting, or typing dependency');
  }

  if ((context.workflows || []).length > 0) {
    addSignal('devops', 'GitHub Actions', `Detected ${context.workflows.length} workflow file(s)`);
  }
  if (/dockerfile|docker-compose/.test(structureText)) {
    addSignal('devops', 'Containerization', 'Detected Docker configuration');
    addSignal('deployment', 'Container-ready deployment', 'Detected Docker deployment signal');
  }
  if (/render\.ya?ml|vercel\.json|netlify\.toml|railway/.test(structureText)) {
    addSignal('deployment', 'Deployment configuration', 'Detected hosting provider configuration');
  }
  if (/__tests__|\/tests\/|\.test\.|\.spec\./.test(structureText)) {
    addSignal('testing', 'Test files', 'Detected test files or test directories');
  }
  if (/readme|documentation|getting started|installation|usage|architecture/.test(readmeText)) {
    addSignal('documentation', 'Project documentation', 'README includes setup, usage, or architecture signals');
  }
  if (/src\/controllers|src\/models|src\/routes|services\/|middlewares\/|context\//.test(structureText)) {
    addSignal('architecture', 'Modular architecture', 'Detected separated routes, models, controllers, services, or context layers');
  }
  if (/auth|oauth|jwt|session|permission/.test(structureText) || /auth|oauth|jwt|session|permission/.test(readmeText)) {
    addSignal('auth-security', 'Auth implementation', 'Detected auth-related files or documentation');
  }
  if (/fix|refactor|review|lint|test|secure|deploy/.test(commitsText)) {
    addSignal('code-quality', 'Maintenance activity', 'Recent commits mention quality, fixes, tests, security, or deployment');
  }
  if (/dashboard|analytics|roadmap|workspace|user|feature|mentor/.test(readmeText)) {
    addSignal('product-thinking', 'Product workflow clarity', 'README describes user-facing workflows or product concepts');
  }

  dependencies.slice(0, 8).forEach(dep => detectedSkills.add(dep));

  return {
    detectedSkills: Array.from(detectedSkills),
    primaryCategories: Array.from(primaryCategories),
    evidenceDetails,
    missingSignals: [
      dependencies.length === 0 ? 'No package dependency signal detected' : null,
      !/test|spec|__tests__|\/tests\//.test(structureText + dependencyText) ? 'No testing signal detected' : null,
      !/docker|render|vercel|netlify|workflow/.test(structureText) ? 'No deployment or CI signal detected' : null,
      !context.readme || context.readme === 'No README found.' ? 'README documentation is missing' : null,
    ].filter(Boolean),
    confidenceBoost: clamp(
      (files.length > 0 ? 12 : 0) +
      (dependencies.length > 0 ? 12 : 0) +
      ((context.workflows || []).length > 0 ? 10 : 0) +
      ((context.configFiles || []).length > 0 ? 8 : 0),
      0,
      35
    ),
  };
};

const detectRepoSkills = (repo, context = null) => {
  const text = normalizeText(repo.name, repo.description, repo.fullName, context?.readme);
  const languages = getRepoLanguages(repo);
  const detectedSkills = new Set(languages);
  const primaryCategories = new Set();
  const evidenceDetails = [];

  languages.forEach(language => {
    (LANGUAGE_CATEGORY_MAP[language] || []).forEach(slug => primaryCategories.add(slug));
  });

  Object.entries(CATEGORY_RULES).forEach(([slug, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      primaryCategories.add(slug);
      matches.slice(0, 3).forEach(match => detectedSkills.add(match));
    }
  });

  const contextSignals = context ? detectContextSignals(context) : null;
  (contextSignals?.detectedSkills || []).forEach(skill => detectedSkills.add(skill));
  (contextSignals?.primaryCategories || []).forEach(slug => primaryCategories.add(slug));
  (contextSignals?.evidenceDetails || []).forEach(detail => evidenceDetails.push(detail));

  let missingSignals = [];
  if (!text.includes('test') && !text.includes('spec')) missingSignals.push('No testing signal detected');
  if (!text.includes('deploy') && !text.includes('docker') && !text.includes('vercel') && !text.includes('render')) {
    missingSignals.push('No deployment signal detected');
  }
  if (!repo.description) missingSignals.push('Repository description is missing');
  if (contextSignals) {
    missingSignals = contextSignals.missingSignals;
  }

  return {
    repoName: repo.name || repo.fullName || 'Unknown repository',
    url: repo.url || repo.htmlUrl || (repo.fullName ? `https://github.com/${repo.fullName}` : undefined),
    detectedSkills: Array.from(detectedSkills).slice(0, 10),
    primaryCategories: Array.from(primaryCategories).slice(0, 5),
    evidenceDetails: evidenceDetails.slice(0, 8),
    missingSignals: missingSignals.slice(0, 4),
    confidence: clamp(
      45 +
      (languages.length * 8) +
      (primaryCategories.size * 6) +
      (contextSignals?.confidenceBoost || 0) -
      (missingSignals.length * 4)
    ),
  };
};

const summarizeProjects = (projects) => {
  let completedTasks = 0;
  let totalTasks = 0;
  let completedPhases = 0;
  let totalPhases = 0;

  projects.forEach(project => {
    (project.phases || []).forEach(phase => {
      totalPhases += 1;
      if (phase.isCompleted) completedPhases += 1;
      (phase.tasks || []).forEach(task => {
        totalTasks += 1;
        if (task.isCompleted) completedTasks += 1;
      });
    });
  });

  return {
    totalProjects: projects.length,
    completedProjects: projects.filter(project => project.status === 'COMPLETED').length,
    inProgressProjects: projects.filter(project => project.status === 'IN_PROGRESS').length,
    totalPhases,
    completedPhases,
    totalTasks,
    completedTasks,
  };
};

const summarizeInsights = (insights) => ({
  totalInsights: insights.length,
  resolvedInsights: insights.filter(insight => insight.isResolved).length,
  unresolvedSecurityInsights: insights.filter(insight => insight.type === 'VULNERABILITY' && !insight.isResolved).length,
});

const scoreCategory = ({ slug, evidenceCount, repoCount, analyticsData, projectStats, insightStats }) => {
  let score = 18 + Math.min(evidenceCount * 9, 45);

  if (repoCount >= 3) score += 8;
  if (analyticsData.contributions?.total >= 100) score += 8;
  if (analyticsData.contributions?.longestStreak >= 10) score += 5;

  if (slug === 'open-source') {
    score += Math.min((analyticsData.overview?.pullRequests || 0) * 2, 16);
    score += Math.min((analyticsData.overview?.issues || 0) * 1.5, 12);
  }

  if (slug === 'code-quality') {
    score += Math.min(insightStats.resolvedInsights * 4, 20);
  }

  if (slug === 'product-thinking' || slug === 'architecture') {
    score += Math.min(projectStats.completedTasks * 2, 16);
  }

  if (slug === 'testing' || slug === 'deployment' || slug === 'devops') {
    score -= evidenceCount === 0 ? 8 : 0;
  }

  return clamp(score);
};

const buildCategoryProfiles = ({ evidenceByCategory, repoCount, analyticsData, projectStats, insightStats }) => (
  SKILL_TAXONOMY.map(category => {
    const evidence = evidenceByCategory[category.slug] || [];
    const score = scoreCategory({
      slug: category.slug,
      evidenceCount: evidence.length,
      repoCount,
      analyticsData,
      projectStats,
      insightStats,
    });
    const confidence = clamp(35 + (repoCount * 6) + (evidence.length * 8));
    const gaps = [];

    if (evidence.length === 0) {
      gaps.push(`No clear ${category.name.toLowerCase()} evidence found in GitHub data`);
    }
    if (category.slug === 'testing' && evidence.length < 2) gaps.push('Add visible tests or coverage signals to tracked repositories');
    if (category.slug === 'deployment' && evidence.length < 2) gaps.push('Ship at least one project with a public deployment trail');
    if (category.slug === 'devops' && evidence.length < 2) gaps.push('Add CI/CD or containerization to a real repository');
    if (category.slug === 'documentation' && evidence.length < 2) gaps.push('Document architecture, setup, and project decisions in READMEs');

    return {
      ...category,
      score,
      level: levelFromScore(score),
      confidence,
      description: evidence.length > 0
        ? `${category.name} score is based on ${evidence.length} detected signal${evidence.length === 1 ? '' : 's'} from GitHub, tracked repos, and GitMentor progress.`
        : `${category.name} has limited visible evidence so far. GitMentor will refine this as more repository and progress data appears.`,
      strengths: evidence.slice(0, 4).map(item => item.label),
      gaps: gaps.slice(0, 4),
      evidence: evidence.slice(0, 6),
      recommendedActions: buildRecommendedActions(category.slug, gaps),
    };
  })
);

const buildRecommendedActions = (slug, gaps = []) => {
  const actionMap = {
    frontend: ['Build one polished UI flow with loading, empty, and error states'],
    backend: ['Expose a small REST API with validation, auth, and predictable error responses'],
    databases: ['Model one feature with relationships, indexes, and migration notes'],
    'api-design': ['Document endpoint contracts and add request/response examples'],
    'auth-security': ['Add secure auth handling and document token/session decisions'],
    testing: ['Add unit tests for core logic and one integration test for a user flow'],
    deployment: ['Deploy a project and add the production URL plus setup notes'],
    architecture: ['Write a short architecture decision record for a tracked project'],
    devops: ['Add a GitHub Actions workflow for lint/build checks'],
    'code-quality': ['Resolve the highest-severity AI insight and record the fix'],
    documentation: ['Upgrade the README with setup, architecture, and screenshots'],
    'open-source': ['Open or review a small PR with clear issue context'],
    'product-thinking': ['Define target users, core workflow, and success metrics for one project'],
  };

  return [...(actionMap[slug] || []), ...gaps.slice(0, 1)].slice(0, 3);
};

const buildNextBestActions = (categories, targetRole) => {
  const track = getCareerTrack(targetRole);
  const trackSlugSet = new Set(track.slugs);

  return categories
    .filter(category => category.score < 65)
    .sort((a, b) => {
      const aPriority = trackSlugSet.has(a.slug) ? -20 : 0;
      const bPriority = trackSlugSet.has(b.slug) ? -20 : 0;
      return (a.score + aPriority) - (b.score + bPriority);
    })
    .slice(0, 3)
    .map(category => ({
      title: `Improve ${category.name}`,
      description: category.recommendedActions[0] || `Add stronger evidence for ${category.name.toLowerCase()}.`,
      categorySlug: category.slug,
      impact: category.score < 35 ? 'HIGH' : 'MEDIUM',
    }));
};

const buildReadinessScores = (categories, targetRole) => {
  const get = (slug) => categories.find(category => category.slug === slug)?.score || 0;
  const average = (slugs) => clamp(slugs.reduce((sum, slug) => sum + get(slug), 0) / slugs.length);
  const selectedTrack = getCareerTrack(targetRole);

  return [
    {
      track: `${selectedTrack.label} Readiness`,
      score: average(selectedTrack.slugs),
      summary: `Measures the most important visible skills for the selected ${selectedTrack.label} path.`,
    },
    {
      track: 'Junior Frontend Readiness',
      score: average(['frontend', 'testing', 'deployment', 'documentation', 'product-thinking']),
      summary: 'Measures visible frontend delivery, polish, testing, deployment, and product clarity.',
    },
    {
      track: 'Full-Stack Builder Readiness',
      score: average(['frontend', 'backend', 'databases', 'api-design', 'auth-security', 'deployment']),
      summary: 'Measures ability to ship a complete app across UI, API, data, auth, and hosting.',
    },
    {
      track: 'Open Source Readiness',
      score: average(['documentation', 'code-quality', 'testing', 'open-source']),
      summary: 'Measures collaboration readiness through docs, maintainability, tests, and public contribution signals.',
    },
  ];
};

export const buildSkillAssessmentSignals = ({ analyticsData, trackedRepos = [], projects = [], insights = [], progressEvents = [], repoContexts = {}, targetRole = 'full-stack-developer' }) => {
  const allRepos = analyticsData.allRepos || [];
  const repoSkillMap = allRepos.map(repo => {
    const context = repoContexts[repo.name] || repoContexts[repo.fullName] || null;
    return detectRepoSkills(repo, context);
  });
  const evidenceByCategory = {};

  repoSkillMap.forEach(repoMap => {
    repoMap.primaryCategories.forEach(slug => {
      const detail = repoMap.evidenceDetails?.find(item => item.slug === slug);
      addEvidence(evidenceByCategory, slug, {
        source: detail ? 'deep-repository' : 'repository',
        label: repoMap.repoName,
        detail: detail?.detail || `Detected ${repoMap.detectedSkills.slice(0, 4).join(', ')}`,
        weight: detail ? 3 : 2,
      });
    });
  });

  (analyticsData.languages || []).forEach(language => {
    (LANGUAGE_CATEGORY_MAP[language.name] || []).forEach(slug => {
      addEvidence(evidenceByCategory, slug, {
        source: 'language',
        label: language.name,
        detail: `${language.percentage}% of visible repository code`,
        weight: 1,
      });
    });
  });

  if ((analyticsData.overview?.pullRequests || 0) > 0) {
    addEvidence(evidenceByCategory, 'open-source', {
      source: 'github',
      label: `${analyticsData.overview.pullRequests} pull requests`,
      detail: 'Public collaboration signal from GitHub GraphQL',
      weight: 2,
    });
  }

  if ((analyticsData.overview?.issues || 0) > 0) {
    addEvidence(evidenceByCategory, 'open-source', {
      source: 'github',
      label: `${analyticsData.overview.issues} issues`,
      detail: 'Issue participation signal from GitHub GraphQL',
      weight: 1,
    });
  }

  const projectStats = summarizeProjects(projects);
  if (projectStats.completedTasks > 0) {
    ['architecture', 'product-thinking', 'code-quality'].forEach(slug => {
      addEvidence(evidenceByCategory, slug, {
        source: 'gitmentor',
        label: `${projectStats.completedTasks} GitMentor tasks completed`,
        detail: 'Execution progress inside generated project workspaces',
        weight: 2,
      });
    });
  }

  const insightStats = summarizeInsights(insights);
  if (insightStats.resolvedInsights > 0) {
    addEvidence(evidenceByCategory, 'code-quality', {
      source: 'gitmentor',
      label: `${insightStats.resolvedInsights} AI insights resolved`,
      detail: 'Repository review issues marked solved',
      weight: 3,
    });
  }

  progressEvents.forEach(event => {
    addEvidence(evidenceByCategory, event.categorySlug, {
      source: 'progress-event',
      label: event.title,
      detail: event.description || `${event.eventType} recorded in GitMentor`,
      weight: event.impactScore || 1,
    });
  });

  trackedRepos.forEach(repo => {
    addEvidence(evidenceByCategory, 'product-thinking', {
      source: 'tracked-repo',
      label: repo.name,
      detail: 'Repository selected for active mentorship tracking',
      weight: 1,
    });
  });

  const categories = buildCategoryProfiles({
    evidenceByCategory,
    repoCount: allRepos.length,
    analyticsData,
    projectStats,
    insightStats,
  });

  const overallScore = clamp(categories.reduce((sum, category) => sum + category.score, 0) / categories.length);
  const confidence = clamp(categories.reduce((sum, category) => sum + category.confidence, 0) / categories.length);

  return {
    taxonomy: SKILL_TAXONOMY,
    careerTrack: getCareerTrack(targetRole),
    targetRole,
    categories,
    repoSkillMap,
    projectStats,
    insightStats,
    progressEventStats: {
      totalEvents: progressEvents.length,
      totalImpact: progressEvents.reduce((sum, event) => sum + (event.impactScore || 1), 0),
    },
    recentProgressEvents: progressEvents.slice(0, 8).map(event => ({
      categorySlug: event.categorySlug,
      categoryName: event.categoryName,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      impactScore: event.impactScore,
      createdAt: event.createdAt,
    })),
    nextBestActions: buildNextBestActions(categories, targetRole),
    readinessScores: buildReadinessScores(categories, targetRole),
    overallScore,
    overallLevel: levelFromScore(overallScore),
    confidence,
  };
};
