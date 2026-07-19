import Project from '../models/Project.js';
import Repository from '../models/Repository.js';
import { generateRoadmap } from '../utils/geminiApi.js';

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

    // Generate phases from Gemini
    const { generateProjectPhases } = await import('../utils/geminiApi.js');
    const phases = await generateProjectPhases(project.title, timeline.duration);

    project.selectedTimeline = timelineId;
    project.phases = phases.map(p => ({
      phaseId: p.phaseId,
      title: p.title,
      description: p.description,
      estimatedTime: p.estimatedTime,
      isCompleted: false
    }));

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error generating phases', error: error.message });
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
