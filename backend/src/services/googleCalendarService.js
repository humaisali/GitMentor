import { google } from 'googleapis';
import { decryptToken } from '../utils/tokenCrypto.js';

export const GOOGLE_CALENDAR_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
];

export const getGoogleCallbackUrl = () => (
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
);

export const createOAuthClient = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getGoogleCallbackUrl()
);

const getStoredRefreshToken = (user) => (
  user.googleCalendar?.refreshToken || user.googleRefreshToken || ''
);

export const getAuthorizedCalendarClient = (user) => {
  const storedToken = getStoredRefreshToken(user);
  if (!storedToken) {
    const error = new Error('Google Calendar is not connected.');
    error.code = 'GOOGLE_RECONNECT_REQUIRED';
    throw error;
  }

  const auth = createOAuthClient();
  auth.setCredentials({ refresh_token: decryptToken(storedToken) });
  return google.calendar({ version: 'v3', auth });
};

export const verifyGoogleConnection = async (user) => {
  const storedToken = getStoredRefreshToken(user);
  if (!storedToken) {
    const error = new Error('Google Calendar is not connected.');
    error.code = 'GOOGLE_RECONNECT_REQUIRED';
    throw error;
  }
  const auth = createOAuthClient();
  auth.setCredentials({ refresh_token: decryptToken(storedToken) });
  const token = await auth.getAccessToken();
  if (!token?.token) throw new Error('Google did not return a valid access token.');
  return true;
};

export const verifyCalendarAccess = async (user) => {
  const calendar = getAuthorizedCalendarClient(user);
  await calendar.events.list({
    calendarId: 'primary',
    maxResults: 1,
    singleEvents: true,
    timeMin: new Date().toISOString(),
  });
  return true;
};

export const getGoogleCalendarErrorDetails = (error) => {
  const providerError = error?.response?.data?.error;
  const providerDetails = Array.isArray(providerError?.details) ? providerError.details : [];
  const errorInfo = providerDetails.find(detail => detail?.reason);
  const help = providerDetails.find(detail => Array.isArray(detail?.links));
  const reason = errorInfo?.reason || providerError?.errors?.[0]?.reason || error?.code || 'CALENDAR_SYNC_FAILED';
  const actionUrl = errorInfo?.metadata?.activationUrl || help?.links?.[0]?.url || '';
  const projectNumber = String(errorInfo?.metadata?.consumer || '').replace('projects/', '');

  if (reason === 'SERVICE_DISABLED' || reason === 'accessNotConfigured') {
    return {
      code: 'CALENDAR_API_DISABLED',
      message: `Google Calendar API is disabled for Google Cloud project ${projectNumber || 'used by these OAuth credentials'}. Enable the API, wait a few minutes, then retry.`,
      actionUrl,
    };
  }
  if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded' || error?.response?.status === 429) {
    return { code: 'CALENDAR_RATE_LIMITED', message: 'Google Calendar temporarily rate-limited this schedule. Wait a minute, then retry.', actionUrl: '' };
  }
  return {
    code: String(reason),
    message: providerError?.message || error?.message || 'Google Calendar sync failed.',
    actionUrl,
  };
};

const buildDescription = (session, project) => {
  const sections = [
    `GitMentor project: ${project.title}`,
    session.phaseTitle
      ? `Roadmap phase: Phase ${session.phaseNumber || '?'} of ${session.phaseCount || '?'} — ${session.phaseTitle}`
      : '',
    session.objective ? `Objective: ${session.objective}` : '',
    session.milestone ? `Milestone: ${session.milestone}` : '',
    session.notes ? `Notes: ${session.notes}` : '',
  ].filter(Boolean);
  return sections.join('\n\n');
};

export const buildGoogleEvent = (session, project, { includeId = false } = {}) => {
  const event = {
    summary: session.title || `GitMentor Build Day: ${project.title}`,
    description: buildDescription(session, project),
    start: {
      dateTime: new Date(session.startAt).toISOString(),
      timeZone: session.timeZone,
    },
    end: {
      dateTime: new Date(session.endAt).toISOString(),
      timeZone: session.timeZone,
    },
    colorId: '9',
    reminders: session.reminderMinutes?.length
      ? {
          useDefault: false,
          overrides: session.reminderMinutes.map(minutes => ({ method: 'popup', minutes })),
        }
      : { useDefault: true },
    extendedProperties: {
      private: {
        gitmentorSessionId: session._id.toString(),
        gitmentorProjectId: project.projectId,
        ...(session.phaseId ? { gitmentorPhaseId: session.phaseId } : {}),
      },
    },
  };

  if (includeId) event.id = session._id.toString();
  return event;
};

export const insertCalendarEvent = async (user, session, project) => {
  const calendar = getAuthorizedCalendarClient(user);
  const response = await calendar.events.insert({
    calendarId: session.googleCalendarId || 'primary',
    requestBody: buildGoogleEvent(session, project, { includeId: true }),
  });
  return response.data;
};

export const updateCalendarEvent = async (user, session, project) => {
  const calendar = getAuthorizedCalendarClient(user);
  const response = await calendar.events.patch({
    calendarId: session.googleCalendarId || 'primary',
    eventId: session.googleEventId,
    requestBody: buildGoogleEvent(session, project),
  });
  return response.data;
};

export const deleteCalendarEvent = async (user, session) => {
  const calendar = getAuthorizedCalendarClient(user);
  await calendar.events.delete({
    calendarId: session.googleCalendarId || 'primary',
    eventId: session.googleEventId,
  });
};

export const getCalendarEvent = async (user, session) => {
  const calendar = getAuthorizedCalendarClient(user);
  const response = await calendar.events.get({
    calendarId: session.googleCalendarId || 'primary',
    eventId: session.googleEventId,
  });
  return response.data;
};

export const isGoogleNotFoundError = (error) => (
  error?.code === 404 || error?.response?.status === 404
);

export const isGoogleCredentialError = (error) => {
  const status = error?.code || error?.response?.status;
  const payload = error?.response?.data?.error;
  const reason = typeof payload === 'string'
    ? payload
    : payload?.message || error?.response?.data?.error_description || error?.message || '';
  return status === 401
    || String(reason).includes('invalid_grant')
    || String(reason).includes('invalid_token');
};
