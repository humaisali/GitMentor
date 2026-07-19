import express from 'express';
import { getGitHubRepos, trackRepository, getTrackedRepos, refreshGitHubRepos } from '../controllers/repositoryController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/github', getGitHubRepos);
router.get('/github/refresh', refreshGitHubRepos);
router.post('/track', trackRepository);
router.get('/tracked', getTrackedRepos);

export default router;
