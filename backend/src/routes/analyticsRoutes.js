import express from 'express';
import { getFullAnalytics, getRecentEvents, getDashboardMetrics } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @route   GET /api/analytics/profile
// @desc    Get user's full GitHub analytics profile (cached)
// @access  Private
router.get('/profile', protect, getFullAnalytics);

// @route   GET /api/analytics/events
// @desc    Get user's recent GitHub activity feed
// @access  Private
router.get('/events', protect, getRecentEvents);

// @route   GET /api/analytics/dashboard
// @desc    Get user's dashboard progress metrics
// @access  Private
router.get('/dashboard', protect, getDashboardMetrics);

export default router;
