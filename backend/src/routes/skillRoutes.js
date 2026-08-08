import express from 'express';
import { getSkillProfile, assessSkills, deleteSkillProfile } from '../controllers/skillController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @route   GET /api/skills/profile
// @desc    Get user's cached skill profile
// @access  Private
router.get('/profile', protect, getSkillProfile);

// @route   POST /api/skills/assess
// @desc    Trigger a new AI skill assessment
// @access  Private
router.post('/assess', protect, assessSkills);

// @route   DELETE /api/skills/profile
// @desc    Delete the existing skill profile
// @access  Private
router.delete('/profile', protect, deleteSkillProfile);

export default router;
