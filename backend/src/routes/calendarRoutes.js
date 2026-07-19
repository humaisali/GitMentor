import express from 'express';
import { scheduleSession, getSessions } from '../controllers/calendarController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/schedule').post(protect, scheduleSession);
router.route('/sessions').get(protect, getSessions);

export default router;
