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

// @desc    Get user's roadmap projects
// @route   GET /api/roadmaps
// @access  Private
export const getRoadmap = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ order: 1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching roadmap', error: error.message });
  }
};

// @desc    Generate a new roadmap using Gemini AI
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

    // 3. Generate Roadmap using Gemini
    const { prompt } = req.body || {};
    const roadmapData = await generateRoadmap(repositories, prompt, skillProfile);

    if (!Array.isArray(roadmapData)) {
      throw new Error(`Gemini did not return an array: ${JSON.stringify(roadmapData)}`);
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

    // Generate from Gemini
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

    const timeline = project.timelineOptions.find(t => t.id === timelineId);
    if (!timeline) return res.status(400).json({ message: 'Invalid timeline ID' });

    // Generate phases and learning materials in parallel from Gemini
    const { generateProjectPhases, generateLearningMaterials } = await import('../utils/geminiApi.js');
    const [phases, learningMaterials] = await Promise.all([
      generateProjectPhases(project.title, timeline.duration),
      generateLearningMaterials(
        project.title,
        project.description,
        project.detailedPlan?.techStack || []
      )
    ]);

    project.selectedTimeline = timelineId;
    project.phases = phases.map(p => ({
      phaseId: p.phaseId,
      title: p.title,
      description: p.description,
      estimatedTime: p.estimatedTime,
      estimatedHours: Math.max(1, Number(p.estimatedHours) || 2),
      suggestedSessionCount: Math.max(1, Number(p.suggestedSessionCount) || 1),
      isCompleted: false
    }));
    project.learningMaterials = learningMaterials.map(m => ({
      title: m.title,
      url: m.url,
      source: m.source
    }));

    await project.save();
    res.status(200).json(project);
  } catch (error) {
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
      if (!Array.isArray(tasksData) || !tasksData.length) throw new Error('Gemini returned no phase tasks.');
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

    // Limit history to last 15 messages to control token usage
    const trimmedHistory = history.slice(-15);

    const reply = await chatWithProjectAssistant(project.toObject(), trimmedHistory, message.trim());

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat message', error: error.message });
  }
};
