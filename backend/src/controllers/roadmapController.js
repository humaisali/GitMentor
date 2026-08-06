import Project from '../models/Project.js';
import Repository from '../models/Repository.js';
import { generateRoadmap, chatWithProjectAssistant } from '../utils/geminiApi.js';

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
    // 1. Fetch user's repos to feed into AI
    const repositories = await Repository.find({ user: req.user._id });

    if (!repositories || repositories.length === 0) {
      return res.status(400).json({ message: 'No repositories found to analyze.' });
    }

    // 2. Generate Roadmap using Gemini
    const { prompt } = req.body || {};
    const roadmapData = await generateRoadmap(repositories, prompt);

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
    const planData = await generateProjectPlan(project.title, project.description);

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
    const tasksData = await generatePhaseTasks(project.title, phase.title, phase.description);

    phase.isStarted = true;
    phase.tasks = tasksData.map(t => ({
      taskId: t.taskId,
      title: t.title,
      description: t.description,
      steps: t.steps || [],
      isCompleted: false
    }));

    await project.save();
    res.status(200).json(project);
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

    task.isCompleted = true;

    await project.save();
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

    phase.isCompleted = true;
    
    // Check if all phases are completed
    const allCompleted = project.phases.every(p => p.isCompleted);
    if (allCompleted) {
      project.status = 'COMPLETED';
      
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
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      return res.status(429).json({ message: 'Gemini API rate limit reached. Please wait a minute and try again.' });
    }
    res.status(500).json({ message: 'Error processing chat message', error: error.message });
  }
};
