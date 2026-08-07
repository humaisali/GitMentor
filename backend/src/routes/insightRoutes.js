import express from 'express';
import { getInsightsForRepo, resolveInsight, getUserInsights } from '../controllers/insightController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/user')
  .get(protect, getUserInsights);

router.route('/:repoId')
  .get(protect, getInsightsForRepo);

router.route('/:id/resolve')
  .patch(protect, resolveInsight);

export default router;
