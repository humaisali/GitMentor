import BuildSession from '../models/BuildSession.js';
import {
  getCalendarEvent,
  isGoogleCredentialError,
  isGoogleNotFoundError,
} from './googleCalendarService.js';

const cancelLocalSession = async (session) => {
  session.status = 'CANCELLED';
  session.syncStatus = 'DELETED';
  session.cancelledAt = new Date();
  session.lastSyncError = undefined;
  await session.save();
};

export const reconcileUserSessions = async (user, { limit = 100 } = {}) => {
  const sessions = await BuildSession.find({
    user: user._id,
    status: 'SCHEDULED',
    googleEventId: { $exists: true },
    startAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).limit(limit);
  let updated = 0;

  for (const session of sessions) {
    try {
      const event = await getCalendarEvent(user, session);
      if (event.status === 'cancelled') {
        await cancelLocalSession(session);
        updated += 1;
        continue;
      }
      const nextStart = event.start?.dateTime ? new Date(event.start.dateTime) : session.startAt;
      const nextEnd = event.end?.dateTime ? new Date(event.end.dateTime) : session.endAt;
      if (+nextStart !== +session.startAt || +nextEnd !== +session.endAt || event.etag !== session.googleEventEtag) {
        session.startAt = nextStart;
        session.endAt = nextEnd;
        session.googleEventEtag = event.etag;
        session.googleEventUrl = event.htmlLink || session.googleEventUrl;
        session.syncStatus = 'SYNCED';
        session.lastSyncError = undefined;
        await session.save();
        updated += 1;
      }
    } catch (error) {
      if (isGoogleNotFoundError(error)) {
        await cancelLocalSession(session);
        updated += 1;
      } else {
        if (isGoogleCredentialError(error)) {
          user.googleCalendar.status = 'RECONNECT_REQUIRED';
          await user.save();
        }
        throw error;
      }
    }
  }
  return { checked: sessions.length, updated };
};
