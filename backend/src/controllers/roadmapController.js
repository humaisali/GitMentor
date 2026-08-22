import Project from '../models/Project.js';
import Repository from '../models/Repository.js';
import SkillProfile from '../models/SkillProfile.js';
import SkillProgressEvent from '../models/SkillProgressEvent.js';
import BuildSession from '../models/BuildSession.js';
import { generateRoadmap, chatWithProjectAssistant } from '../utils/geminiApi.js';

const normalizeTargetSkills = (skills = [], skillProfile = null) => {
  const fallbackSkills = (skillProfile?.categories || [])
    .filter(category => category.score < 65)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(category => ({ name: category.name, slug: category.slug }));

  const normalized = Array.isArray(skills) ? skills
    .filter(skill => skill?.name || skill?.slug)
    .map(skill => ({
      name: skill.name || skill.slug || 'Skill',
      slug: skill.slug || String(skill.name || 'skill').toLowerCase().replace(/\s+/g, '-'),
    }))
    .slice(0, 4) : [];

  return normalized.length > 0 ? normalized : fallbackSkills;
};

const normalizeAddressedGaps = (gaps = [], targetSkills = [], skillProfile = null) => {
  if (Array.isArray(gaps) && gaps.length > 0) return gaps.filter(Boolean).slice(0, 4);

  const targetSlugs = new Set(targetSkills.map(skill => skill.slug));
  return (skillProfile?.categories || [])
    .filter(category => targetSlugs.has(category.slug))
    .flatMap(category => category.gaps || [])
    .filter(Boolean)
    .slice(0, 4);
};

const getDefaultReadinessTrack = (skillProfile = null) => (
  (skillProfile?.readinessScores || [])
    .slice()
    .sort((a, b) => a.score - b.score)[0]?.track || 'Full-Stack Builder Readiness'
);

const recordSkillProgressEvents = async ({ userId, project, eventType, title, description, impactScore }) => {
  const targetSkills = project.targetSkills?.length > 0
    ? project.targetSkills
    : [{ name: 'Product Thinking', slug: 'product-thinking' }];

  const events = targetSkills.map(skill => ({
    user: userId,
    project: project._id,
    categorySlug: skill.slug || String(skill.name || 'skill').toLowerCase().replace(/\s+/g, '-'),
    categoryName: skill.name || skill.slug || 'Skill',
    eventType,
    title,
    description,
    impactScore,
  }));

  await SkillProgressEvent.insertMany(events);
};

const normalizeGeneratedList = value => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const getTimelineDays = (timeline) => {
  const durationText = String(timeline?.duration || '');
  const value = Number.parseInt(durationText, 10);
  const inferredDays = /week/i.test(durationText) ? value * 7 : value;
  return Math.max(1, Number(timeline?.durationDays) || inferredDays || 1);
};

export const allocatePhaseDays = (phases = [], durationDays = 1) => {
  const targetDays = Math.max(1, Math.round(Number(durationDays) || 1));
  if (!phases.length) return [];
  const weights = phases.map(phase => Math.max(
    1,
    Number(phase.suggestedSessionCount) || 0,
    Math.ceil((Number(phase.estimatedHours) || 2) / 2)
  ));
  const allocated = phases.map(() => 0);

  for (let index = 0; index < Math.min(phases.length, targetDays); index += 1) allocated[index] = 1;
  for (let remaining = targetDays - allocated.reduce((sum, count) => sum + count, 0); remaining > 0; remaining -= 1) {
    let selectedIndex = 0;
    let lowestCoverage = Number.POSITIVE_INFINITY;
    weights.forEach((weight, index) => {
      const coverage = allocated[index] / weight;
      if (coverage < lowestCoverage) {
        lowestCoverage = coverage;
        selectedIndex = index;
      }
    });
    allocated[selectedIndex] += 1;
  }
  return allocated;
};

const GENERAL_LEARNING_MATERIALS = [
  {
    title: 'MDN Learn Web Development',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    source: 'MDN Web Docs',
  },
  {
    title: 'GitHub Skills: Practice real-world GitHub workflows',
    url: 'https://skills.github.com/',
    source: 'GitHub Skills',
  },
  {
    title: 'OWASP Developer Guide',
    url: 'https://devguide.owasp.org/',
    source: 'OWASP',
  },
  {
    title: 'web.dev Learn: Modern web development courses',
    url: 'https://web.dev/learn/',
    source: 'web.dev',
  },
];

const TOPIC_LEARNING_MATERIALS = [
  {
    keywords: ['auth', 'login', 'password', 'session', 'jwt', 'security', 'authorization', 'rbac'],
    title: 'Authentication Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
    source: 'OWASP',
  },
  {
    keywords: ['auth', 'login', 'password', 'security'],
    title: 'Password Storage Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
    source: 'OWASP',
  },
  {
    keywords: ['auth', 'login', 'session', 'jwt', 'security'],
    title: 'Session Management Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
    source: 'OWASP',
  },
  {
    keywords: ['auth', 'login', 'jwt', 'http', 'api'],
    title: 'HTTP Authentication Guide',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication',
    source: 'MDN Web Docs',
  },
  {
    keywords: ['api', 'rest', 'backend', 'express', 'node'],
    title: 'Express Production Security Best Practices',
    url: 'https://expressjs.com/en/advanced/best-practice-security/',
    source: 'Express Docs',
  },
  {
    keywords: ['react', 'frontend', 'ui'],
    title: 'React Learn',
    url: 'https://react.dev/learn',
    source: 'React Docs',
  },
  {
    keywords: ['node', 'node.js', 'backend', 'javascript'],
    title: 'Introduction to Node.js',
    url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    source: 'Node.js Docs',
  },
  {
    keywords: ['mongodb', 'database', 'schema', 'data model'],
    title: 'MongoDB Data Modeling',
    url: 'https://www.mongodb.com/docs/manual/data-modeling/',
    source: 'MongoDB Docs',
  },
  {
    keywords: ['postgres', 'postgresql', 'sql', 'database'],
    title: 'PostgreSQL Tutorial',
    url: 'https://www.postgresql.org/docs/current/tutorial.html',
    source: 'PostgreSQL Docs',
  },
  {
    keywords: ['test', 'testing', 'quality', 'vitest'],
    title: 'Vitest Guide',
    url: 'https://vitest.dev/guide/',
    source: 'Vitest Docs',
  },
  {
    keywords: ['deploy', 'deployment', 'container', 'docker'],
    title: 'Docker Get Started',
    url: 'https://docs.docker.com/get-started/',
    source: 'Docker Docs',
  },
  {
    keywords: ['typescript', 'type-safe', 'type safe'],
    title: 'The TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    source: 'TypeScript Docs',
  },
];

export const buildFallbackLearningMaterials = project => {
  const techStack = Array.isArray(project?.detailedPlan?.techStack)
    ? project.detailedPlan.techStack
    : [];
  const context = [project?.title, project?.description, ...techStack]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matched = TOPIC_LEARNING_MATERIALS.filter(material => (
    material.keywords.some(keyword => context.includes(keyword))
  )).map(({ keywords, ...material }) => material);

  const unique = new Map();
  [...matched, ...GENERAL_LEARNING_MATERIALS].forEach(material => {
    if (!unique.has(material.url)) unique.set(material.url, material);
  });

  return Array.from(unique.values()).slice(0, 6);
};

const mergeLearningMaterials = (...collections) => {
  const unique = new Map();
  collections.flat().forEach(material => {
    if (!material?.title || !/^https?:\/\//i.test(String(material?.url || ''))) return;
    if (!unique.has(material.url)) {
      unique.set(material.url, {
        title: String(material.title),
        url: String(material.url),
        source: String(material.source || 'Web'),
      });
    }
  });
  return Array.from(unique.values()).slice(0, 6);
};

const buildFallbackProjectPhases = (project, timeline) => {
  const duration = timeline?.duration || project.estTime || 'selected timeline';
  const projectTitle = project?.title || 'this project';

  return [
    {
      phaseId: 'PHASE-1',
      title: 'Project Setup & Requirements',
      description: `Define the scope for ${projectTitle}, confirm the core requirements, choose the initial architecture, and prepare the development environment.`,
      estimatedTime: `Start of ${duration}`,
      estimatedHours: 4,
      suggestedSessionCount: 2,
    },
    {
      phaseId: 'PHASE-2',
      title: 'Core Feature Implementation',
      description: `Build the primary user-facing and backend functionality for ${projectTitle}, keeping the implementation focused on the selected project goals.`,
      estimatedTime: `Middle of ${duration}`,
      estimatedHours: 8,
      suggestedSessionCount: 4,
    },
    {
      phaseId: 'PHASE-3',
      title: 'Data, Validation & Integrations',
      description: 'Connect the main data flows, add validation, handle important edge cases, and integrate any external services or APIs required by the blueprint.',
      estimatedTime: `Middle of ${duration}`,
      estimatedHours: 6,
      suggestedSessionCount: 3,
    },
    {
      phaseId: 'PHASE-4',
      title: 'Testing, Documentation & Delivery',
      description: 'Verify the complete workflow, add targeted tests, document setup and architecture decisions, and prepare the project for review or deployment.',
      estimatedTime: `End of ${duration}`,
      estimatedHours: 6,
      suggestedSessionCount: 3,
    },
  ];
};

// @desc    Get user's roadmap projects
// @route   GET /api/roadmaps
// @access  Private
export const getRoadmap = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ order: 1 });

    await Promise.all(projects.map(async project => {
      let needsSave = false;
      const needsResourceRepair = project.selectedTimeline
        && project.phases?.length > 0
        && (!project.learningMaterials || project.learningMaterials.length === 0);

      if (needsResourceRepair) {
        project.learningMaterials = buildFallbackLearningMaterials(project);
        needsSave = true;
      }

      const timeline = (project.timelineOptions || []).find(option => option.id === project.selectedTimeline);
      if (timeline && project.phases?.length) {
        const allocations = allocatePhaseDays(project.phases, getTimelineDays(timeline));
        const allocationChanged = project.phases.some((phase, index) => (
          phase.allocatedDays !== allocations[index]
          || phase.estimatedTime !== `${allocations[index]} Build Day${allocations[index] === 1 ? '' : 's'} within ${timeline.duration}`
        ));
        if (allocationChanged) {
          project.phases.forEach((phase, index) => {
            phase.allocatedDays = allocations[index];
            phase.estimatedTime = `${allocations[index]} Build Day${allocations[index] === 1 ? '' : 's'} within ${timeline.duration}`;
          });
          needsSave = true;
        }
      }

      if (needsSave) await project.save();
    }));

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching roadmap', error: error.message });
  }
};

// @desc    Generate a new roadmap using the configured AI providers
// @route   POST /api/roadmaps/generate
// @access  Private
export const generateNewRoadmap = async (req, res) => {
  try {
    const upcomingBuildDays = await BuildSession.countDocuments({
      user: req.user._id,
      status: 'SCHEDULED',
      startAt: { $gte: new Date() },
    });
    if (upcomingBuildDays > 0) {
      return res.status(409).json({
        message: `Cancel or complete your ${upcomingBuildDays} upcoming Build Day${upcomingBuildDays === 1 ? '' : 's'} before regenerating the roadmap.`,
        code: 'UPCOMING_BUILD_DAYS_EXIST',
      });
    }

    // 1. Fetch user's repos to feed into AI
    const repositories = await Repository.find({ user: req.user._id });

    if (!repositories || repositories.length === 0) {
      return res.status(400).json({ message: 'No repositories found to analyze.' });
    }

    // 2. Fetch skill profile if available (for enhanced personalization)
    const skillProfile = await SkillProfile.findOne({ user: req.user._id });

    // 3. Generate the roadmap through the AI router.
    const { prompt } = req.body || {};
    const roadmapData = await generateRoadmap(repositories, prompt, skillProfile);

    if (!Array.isArray(roadmapData)) {
      throw new Error(`The AI provider did not return a roadmap array: ${JSON.stringify(roadmapData)}`);
    }

    // 3. Delete old roadmap if exists
    await Project.deleteMany({ user: req.user._id });

    // 4. Save new roadmap
    const savedProjects = [];
    for (let i = 0; i < roadmapData.length; i++) {
      const item = roadmapData[i];
      
      let mappedDifficulty = 'INTERMEDIATE';
      if (item.difficulty) {
        const d = String(item.difficulty).toUpperCase();
        if (d.includes('BEGIN')) mappedDifficulty = 'BEGINNER';
        else if (d.includes('ADV')) mappedDifficulty = 'ADVANCED';
      }

      const project = new Project({
        user: req.user._id,
        projectId: item.projectId || `MOD-${i}`,
        title: item.title || 'Untitled Project',
        description: item.description || '',
        difficulty: mappedDifficulty,
        estTime: item.estTime || '1 Week',
        prereq: item.prereq || 'NONE',
        targetSkills: normalizeTargetSkills(item.targetSkills, skillProfile),
        addressedGaps: normalizeAddressedGaps(
          item.addressedGaps,
          normalizeTargetSkills(item.targetSkills, skillProfile),
          skillProfile
        ),
        skillRationale: item.skillRationale || 'This project was selected to strengthen priority gaps from your latest GitMentor skill assessment.',
        readinessTrack: item.readinessTrack || getDefaultReadinessTrack(skillProfile),
        order: i + 1,
        status: i === 0 ? 'IN_PROGRESS' : 'LOCKED'
      });
      const saved = await project.save();
      savedProjects.push(saved);
    }

    res.status(201).json(savedProjects);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    import('fs').then(fs => fs.writeFileSync('roadmap_error.log', error.stack || error.message));
    res.status(500).json({ message: 'Server Error generating roadmap', error: error.message });
  }
};

// @desc    Generate detailed plan and timeline options for a project
// @route   POST /api/roadmaps/:projectId/plan
// @access  Private
export const generatePlan = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ projectId, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Generate through the configured AI provider.
    const { generateProjectPlan } = await import('../utils/geminiApi.js');
    const planData = await generateProjectPlan(project.title, project.description, {
      targetSkills: project.targetSkills || [],
      addressedGaps: project.addressedGaps || [],
      readinessTrack: project.readinessTrack,
      skillRationale: project.skillRationale,
    });

    project.detailedPlan = {
      scope: planData.scope,
      objectives: planData.objectives,
      methodologies: planData.methodologies,
      techStack: planData.techStack,
    };
    project.timelineOptions = planData.timelineOptions;
    
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error generating plan', error: error.message });
  }
};

// @desc    Select a timeline and generate phases
// @route   POST /api/roadmaps/:projectId/timeline
// @access  Private
export const selectTimeline = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timelineId } = req.body;
    
    const project = await Project.findOne({ projectId, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const timeline = (project.timelineOptions || []).find(t => t.id === timelineId);
    if (!timeline) return res.status(400).json({ message: 'Invalid timeline ID' });

    const { generateProjectPhases, generateLearningMaterials } = await import('../utils/geminiApi.js');

    let phases = [];
    let timelineGeneration = 'AI';
    try {
      phases = normalizeGeneratedList(await generateProjectPhases(project.title, timeline.duration));
      if (phases.length < 4) throw new Error('The AI provider returned fewer than 4 project phases.');
    } catch (generationError) {
      console.warn(`Falling back to deterministic phases for ${projectId}: ${generationError.message}`);
      timelineGeneration = 'FALLBACK';
      phases = buildFallbackProjectPhases(project, timeline);
    }

    let aiLearningMaterials = [];
    let materialsGeneration = 'AI';
    try {
      aiLearningMaterials = normalizeGeneratedList(await generateLearningMaterials(
        project.title,
        project.description,
        project.detailedPlan?.techStack || []
      ));
      if (aiLearningMaterials.length < 4) materialsGeneration = 'HYBRID';
    } catch (materialsError) {
      console.warn(`Learning material generation failed for ${projectId}: ${materialsError.message}`);
      materialsGeneration = 'FALLBACK';
    }

    const learningMaterials = mergeLearningMaterials(
      aiLearningMaterials,
      buildFallbackLearningMaterials(project)
    );

    project.selectedTimeline = timelineId;
    project.phases = phases.map(p => ({
      phaseId: p.phaseId,
      title: p.title,
      description: p.description,
      estimatedTime: p.estimatedTime,
      estimatedHours: Math.max(1, Math.round(Number(p.estimatedHours) || 2)),
      suggestedSessionCount: Math.max(1, Math.round(Number(p.suggestedSessionCount) || 1)),
      isCompleted: false,
      isStarted: false,
      tasks: [],
    }));
    const allocations = allocatePhaseDays(project.phases, getTimelineDays(timeline));
    project.phases.forEach((phase, index) => {
      phase.allocatedDays = allocations[index];
      phase.estimatedTime = `${allocations[index]} Build Day${allocations[index] === 1 ? '' : 's'} within ${timeline.duration}`;
    });
    project.learningMaterials = learningMaterials.map(m => ({
      title: m.title,
      url: m.url,
      source: m.source
    }));

    await project.save();
    res.status(200).json({ ...project.toObject(), timelineGeneration, materialsGeneration });
  } catch (error) {
    console.error('Error selecting timeline:', error);
    res.status(500).json({ message: 'Error generating phases', error: error.message });
  }
};

export const buildFallbackPhaseTasks = (phase) => {
  const title = String(phase?.title || 'Project phase');
  const description = String(phase?.description || `Complete the ${title} phase.`);
  return [
    { taskId: `${phase?.phaseId || 'PHASE'}-T1`, title: `Define acceptance criteria for ${title}`, description, steps: ['Review the phase goal and constraints.', 'Write measurable completion criteria.', 'Confirm dependencies and expected outputs.'] },
    { taskId: `${phase?.phaseId || 'PHASE'}-T2`, title: `Implement the core ${title} work`, description, steps: ['Break the implementation into small changes.', 'Implement the highest-priority path.', 'Keep changes focused and reviewable.'] },
    { taskId: `${phase?.phaseId || 'PHASE'}-T3`, title: `Verify ${title}`, description, steps: ['Exercise the primary success path.', 'Test important edge cases and failure paths.', 'Fix regressions and record verification evidence.'] },
    { taskId: `${phase?.phaseId || 'PHASE'}-T4`, title: `Document and finalize ${title}`, description, steps: ['Document decisions and usage.', 'Review the acceptance criteria.', 'Commit the completed work and note follow-ups.'] },
  ];
};

// @desc    Start a phase and generate tasks
// @route   POST /api/roadmaps/:projectId/phases/:phaseId/start
// @access  Private
export const startPhase = async (req, res) => {
  try {
    const { projectId, phaseId } = req.params;
    
    const project = await Project.findOne({ projectId, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const phase = project.phases.find(p => p.phaseId === phaseId);
    if (!phase) return res.status(404).json({ message: 'Phase not found' });
    if (phase.isStarted) return res.status(400).json({ message: 'Phase already started' });

    const { generatePhaseTasks } = await import('../utils/geminiApi.js');
    let tasksData;
    let taskGeneration = 'AI';
    try {
      tasksData = await generatePhaseTasks(project.title, phase.title, phase.description);
      if (!Array.isArray(tasksData) || !tasksData.length) throw new Error('The AI provider returned no phase tasks.');
    } catch (generationError) {
      console.warn(`Falling back to deterministic tasks for ${projectId}/${phaseId}: ${generationError.message}`);
      taskGeneration = 'FALLBACK';
      tasksData = buildFallbackPhaseTasks(phase);
    }

    phase.isStarted = true;
    phase.tasks = tasksData.map(t => ({
      taskId: t.taskId,
      title: t.title,
      description: t.description,
      steps: t.steps || [],
      isCompleted: false
    }));

    await project.save();
    res.status(200).json({ ...project.toObject(), taskGeneration });
  } catch (error) {
    res.status(500).json({ message: 'Error starting phase', error: error.message });
  }
};

// @desc    Mark a task as completed
// @route   POST /api/roadmaps/:projectId/phases/:phaseId/tasks/:taskId/complete
// @access  Private
export const completeTask = async (req, res) => {
  try {
    const { projectId, phaseId, taskId } = req.params;

    const project = await Project.findOne({ projectId, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const phase = project.phases.find(p => p.phaseId === phaseId);
    if (!phase) return res.status(404).json({ message: 'Phase not found' });

    const task = phase.tasks.find(t => t.taskId === taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.isCompleted) {
      return res.status(200).json(project);
    }

    task.isCompleted = true;

    await project.save();
    await recordSkillProgressEvents({
      userId: req.user._id,
      project,
      eventType: 'TASK_COMPLETED',
      title: `Completed task: ${task.title}`,
      description: `Completed a GitMentor task in "${project.title}" targeting ${project.readinessTrack || 'skill growth'}.`,
      impactScore: 1,
    });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error completing task', error: error.message });
  }
};

// @desc    Mark a phase as completed
// @route   POST /api/roadmaps/:projectId/phases/:phaseId/complete
// @access  Private
export const completePhase = async (req, res) => {
  try {
    const { projectId, phaseId } = req.params;
    
    const project = await Project.findOne({ projectId, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const phase = project.phases.find(p => p.phaseId === phaseId);
    if (!phase) return res.status(404).json({ message: 'Phase not found' });

    if (phase.isCompleted) {
      return res.status(200).json(project);
    }

    phase.isCompleted = true;
    await recordSkillProgressEvents({
      userId: req.user._id,
      project,
      eventType: 'PHASE_COMPLETED',
      title: `Completed phase: ${phase.title}`,
      description: `Finished a project phase in "${project.title}" and strengthened its target skills.`,
      impactScore: 3,
    });
    
    // Check if all phases are completed
    const allCompleted = project.phases.every(p => p.isCompleted);
    if (allCompleted) {
      project.status = 'COMPLETED';
      await recordSkillProgressEvents({
        userId: req.user._id,
        project,
        eventType: 'PROJECT_COMPLETED',
        title: `Completed project: ${project.title}`,
        description: `Completed the full GitMentor project for ${project.readinessTrack || 'skill growth'}.`,
        impactScore: 6,
      });
      
      // Unlock next project
      const nextProject = await Project.findOne({ user: req.user._id, order: project.order + 1 });
      if (nextProject) {
        nextProject.status = 'IN_PROGRESS';
        await nextProject.save();
      }
    }

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error completing phase', error: error.message });
  }
};

// @desc    Chat with project-scoped AI assistant
// @route   POST /api/roadmaps/:projectId/chat
// @access  Private
export const chatWithProject = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const project = await Project.findOne({ projectId: req.params.projectId, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Keep project chat context bounded to control latency and provider token limits.
    const configuredHistoryLimit = Number(process.env.AI_CHAT_HISTORY_LIMIT);
    const historyLimit = Number.isFinite(configuredHistoryLimit) && configuredHistoryLimit > 0
      ? Math.floor(configuredHistoryLimit)
      : 12;
    const trimmedHistory = history.slice(-historyLimit);

    const reply = await chatWithProjectAssistant(
      project.toObject(),
      trimmedHistory,
      message.trim(),
      req.user.preferences?.mentor
    );

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat message', error: error.message });
  }
};
