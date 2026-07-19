import express from 'express';
import { getInsightsForRepo } from '../controllers/insightController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/:repoId')
  .get(protect, getInsightsForRepo);

export default router;
