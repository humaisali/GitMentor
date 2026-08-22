import express from 'express';
import {
  scheduleSession,
  scheduleSessionsBatch,
  getSessions,
  updateSession,
  cancelSession,
  completeSession,
  retrySessionSync,
  reconcileSessions,
} from '../controllers/calendarController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/sessions').get(protect, getSessions).post(protect, scheduleSession);
router.post('/sessions/batch', protect, scheduleSessionsBatch);
router.patch('/sessions/:sessionId', protect, updateSession);
router.delete('/sessions/:sessionId', protect, cancelSession);
router.post('/sessions/:sessionId/complete', protect, completeSession);
router.post('/sessions/:sessionId/retry', protect, retrySessionSync);
router.post('/reconcile', protect, reconcileSessions);
router.post('/schedule', protect, scheduleSession);

export default router;
