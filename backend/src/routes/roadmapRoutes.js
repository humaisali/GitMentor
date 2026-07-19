import express from 'express';
import { getRoadmap, generateNewRoadmap, generatePlan, selectTimeline, completePhase } from '../controllers/roadmapController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getRoadmap);

router.route('/generate')
  .post(protect, generateNewRoadmap);

router.route('/:projectId/plan')
  .post(protect, generatePlan);

router.route('/:projectId/timeline')
  .post(protect, selectTimeline);

router.route('/:projectId/phases/:phaseId/complete')
  .post(protect, completePhase);

export default router;
