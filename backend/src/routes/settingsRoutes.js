import express from 'express';
import {
  deleteAccount,
  exportUserData,
  getSettings,
  logoutAllSessions,
  updateSettings,
} from '../controllers/settingsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getSettings);
router.patch('/', updateSettings);
router.get('/export', exportUserData);
router.post('/logout-all', logoutAllSessions);
router.delete('/account', deleteAccount);

export default router;
