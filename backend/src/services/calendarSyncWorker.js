import User from '../models/User.js';
import { reconcileUserSessions } from './calendarReconciliationService.js';

const reconcileConnectedUsers = async () => {
  const users = await User.find({
    'googleCalendar.status': 'CONNECTED',
    'googleCalendar.refreshToken': { $exists: true, $ne: '' },
  }).cursor();
  for await (const user of users) {
    try {
      await reconcileUserSessions(user);
    } catch (error) {
      console.error(`Calendar reconciliation failed for user ${user._id}: ${error.message}`);
    }
  }
};

export const startCalendarSyncWorker = () => {
  if (process.env.CALENDAR_SYNC_ENABLED === 'false' || process.env.NODE_ENV === 'test') return null;
  const minutes = Math.max(1, Number(process.env.CALENDAR_SYNC_INTERVAL_MINUTES) || 15);
  const initial = setTimeout(() => {
    reconcileConnectedUsers().catch(error => console.error(`Initial calendar reconciliation failed: ${error.message}`));
  }, 0);
  initial.unref();
  const timer = setInterval(() => {
    reconcileConnectedUsers().catch(error => console.error(`Calendar worker failed: ${error.message}`));
  }, minutes * 60 * 1000);
  timer.unref();
  return timer;
};
