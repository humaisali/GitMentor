import BuildSession from '../models/BuildSession.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import SkillProgressEvent from '../models/SkillProgressEvent.js';
import {
  deleteCalendarEvent,
  getGoogleCalendarErrorDetails,
  getCalendarEvent,
  insertCalendarEvent,
  isGoogleCredentialError,
  isGoogleNotFoundError,
  updateCalendarEvent,
  verifyCalendarAccess,
} from '../services/googleCalendarService.js';
import { reconcileUserSessions } from '../services/calendarReconciliationService.js';

const MAX_BATCH_SIZE = 50;
const MAX_SESSION_HOURS = 24;

const isValidTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
};

export const parseSessionInput = (input = {}) => {
  const startAt = new Date(input.startAt || input.startTime);
  const endAt = new Date(input.endAt || input.endTime);
  const timeZone = input.timeZone || 'UTC';
  const reminderMinutes = Array.isArray(input.reminderMinutes)
    ? [...new Set(input.reminderMinutes.map(Number))]
    : [30];

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw Object.assign(new Error('Valid start and end times are required.'), { statusCode: 400 });
  }
  if (endAt <= startAt) {
    throw Object.assign(new Error('End time must be after start time.'), { statusCode: 400 });
  }
  if (endAt.getTime() - startAt.getTime() > MAX_SESSION_HOURS * 60 * 60 * 1000) {
    throw Object.assign(new Error(`A Build Day cannot exceed ${MAX_SESSION_HOURS} hours.`), { statusCode: 400 });
  }
  if (!isValidTimeZone(timeZone)) {
    throw Object.assign(new Error('A valid IANA timezone is required.'), { statusCode: 400 });
  }
  if (reminderMinutes.length > 5 || reminderMinutes.some(value => !Number.isInteger(value) || value < 0 || value > 40320)) {
    throw Object.assign(new Error('Provide up to five valid reminders between 0 and 40320 minutes.'), { statusCode: 400 });
  }

  return {
    startAt,
    endAt,
    timeZone,
    reminderMinutes,
    title: String(input.title || '').trim().slice(0, 200),
    objective: String(input.objective || '').trim().slice(0, 1000),
    milestone: String(input.milestone || '').trim().slice(0, 500),
    notes: String(input.notes || '').trim().slice(0, 2000),
    phaseId: input.phaseId ? String(input.phaseId) : undefined,
    taskIds: Array.isArray(input.taskIds) ? [...new Set(input.taskIds.map(String))] : [],
  };
};

const findOwnedProject = async (userId, projectId) => {
  if (!projectId) throw Object.assign(new Error('A project is required.'), { statusCode: 400 });
  const project = await Project.findOne({ user: userId, projectId });
  if (!project) throw Object.assign(new Error('Project not found.'), { statusCode: 404 });
  return project;
};

const validatePhaseAndTasks = (project, data) => {
  if (!data.phaseId && data.taskIds.length) {
    throw Object.assign(new Error('A phase is required when tasks are selected.'), { statusCode: 400 });
  }
  if (!data.phaseId) return;
  const phase = project.phases.find(item => item.phaseId === data.phaseId);
  if (!phase) throw Object.assign(new Error('Selected phase does not belong to this project.'), { statusCode: 400 });
  const validTaskIds = new Set((phase.tasks || []).map(task => task.taskId));
  if (data.taskIds.some(taskId => !validTaskIds.has(taskId))) {
    throw Object.assign(new Error('One or more selected tasks do not belong to the phase.'), { statusCode: 400 });
  }
};

export const getTimelineDurationDays = (timeline) => {
  const durationText = String(timeline?.duration || '');
  const value = Number.parseInt(durationText, 10);
  const inferredDays = /week/i.test(durationText) ? value * 7 : value;
  return Math.max(1, Number(timeline?.durationDays) || inferredDays || 1);
};

const calendarDayOrdinal = (value, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = type => Number(parts.find(item => item.type === type)?.value);
  return Math.floor(Date.UTC(part('year'), part('month') - 1, part('day')) / (24 * 60 * 60 * 1000));
};

const validateBatchTimelineBounds = async (userId, inputs) => {
  const projectIds = [...new Set(inputs.map(input => input.projectId).filter(Boolean))];
  const projects = await Project.find({ user: userId, projectId: { $in: projectIds } });
  const projectMap = new Map(projects.map(project => [project.projectId, project]));
  const timelineStarts = new Map();
  const sessionCounts = new Map();
  const occupiedDays = new Set();

  for (const input of inputs) {
    const project = projectMap.get(input.projectId);
    if (!project) throw Object.assign(new Error(`Project ${input.projectId || ''} was not found.`), { statusCode: 404 });
    const timeline = (project.timelineOptions || []).find(option => option.id === project.selectedTimeline);
    if (!timeline) throw Object.assign(new Error(`Confirm a project timeline before auto-scheduling ${project.title}.`), { statusCode: 400 });
    const startAt = new Date(input.startAt);
    const timelineStartAt = new Date(input.timelineStartAt);
    const timeZone = input.timeZone || 'UTC';
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(timelineStartAt.getTime()) || !isValidTimeZone(timeZone)) {
      throw Object.assign(new Error('Auto-scheduled sessions require a valid timeline start and timezone.'), { statusCode: 400 });
    }
    const existingStart = timelineStarts.get(project.projectId);
    if (existingStart !== undefined && existingStart !== timelineStartAt.getTime()) {
      throw Object.assign(new Error('All sessions for a project must use the same timeline start.'), { statusCode: 400 });
    }
    timelineStarts.set(project.projectId, timelineStartAt.getTime());

    const dayOffset = calendarDayOrdinal(startAt, timeZone) - calendarDayOrdinal(timelineStartAt, timeZone);
    const durationDays = getTimelineDurationDays(timeline);
    if (dayOffset < 0 || dayOffset >= durationDays) {
      throw Object.assign(new Error(`${project.title} uses a ${timeline.duration || `${durationDays}-day`} timeline. Every Build Day must fall within that confirmed window.`), { statusCode: 400 });
    }
    const occupiedKey = `${project.projectId}:${dayOffset}`;
    if (occupiedDays.has(occupiedKey)) {
      throw Object.assign(new Error('Auto-planning supports one Build Day per project day.'), { statusCode: 400 });
    }
    occupiedDays.add(occupiedKey);
    sessionCounts.set(project.projectId, (sessionCounts.get(project.projectId) || 0) + 1);
  }

  for (const [projectId, sessionCount] of sessionCounts) {
    const project = projectMap.get(projectId);
    const timeline = project.timelineOptions.find(option => option.id === project.selectedTimeline);
    const durationDays = getTimelineDurationDays(timeline);
    if (sessionCount !== durationDays) {
      throw Object.assign(new Error(`${project.title} has a confirmed ${timeline.duration || `${durationDays}-day`} timeline and requires exactly ${durationDays} Build Days.`), { statusCode: 400 });
    }
  }
};

const markReconnectRequired = async (user, error) => {
  if (!user || !isGoogleCredentialError(error)) return;
  if (!user.googleCalendar) user.googleCalendar = {};
  user.googleCalendar.status = 'RECONNECT_REQUIRED';
  await user.save();
};

const applyGoogleEvent = (session, event) => {
  session.googleEventId = event.id || session.googleEventId;
  session.googleEventUrl = event.htmlLink || session.googleEventUrl;
  session.googleEventEtag = event.etag || session.googleEventEtag;
  session.syncStatus = 'SYNCED';
  session.lastSyncError = undefined;
};

const hydrateLegacySession = async session => {
  const raw = session.toObject();
  const legacyStart = raw.startTime ? new Date(raw.startTime) : null;
  const legacyEnd = raw.endTime ? new Date(raw.endTime) : null;
  if (!session.startAt && legacyStart && !Number.isNaN(legacyStart.getTime())) session.startAt = legacyStart;
  if (!session.endAt && legacyEnd && !Number.isNaN(legacyEnd.getTime())) session.endAt = legacyEnd;

  if (!session.projectId || !session.projectTitle) {
    const project = session.project ? await Project.findById(session.project) : null;
    const fallbackTitle = String(session.title || 'Legacy Build Day')
      .replace(/^GitMentor Build Day:\s*/i, '')
      .trim();
    session.projectId ||= project?.projectId || `legacy-${session.project || session._id}`;
    session.projectTitle ||= project?.title || fallbackTitle;
  }
  return session;
};

const createSession = async ({ user, input }) => {
  const project = await findOwnedProject(user._id, input.projectId);
  const data = parseSessionInput(input);
  validatePhaseAndTasks(project, data);

  const session = new BuildSession({
    ...data,
    user: user._id,
    project: project._id,
    projectId: project.projectId,
    projectTitle: project.title,
    title: data.title || `GitMentor Build Day: ${project.title}`,
    syncStatus: 'PENDING',
  });
  session.googleEventId = session._id.toString();
  await session.save();

  try {
    let event;
    try {
      event = await insertCalendarEvent(user, session, project);
    } catch (error) {
      if (error?.code === 409 || error?.response?.status === 409) event = await getCalendarEvent(user, session);
      else throw error;
    }
    applyGoogleEvent(session, event);
    await session.save();
    return await session.populate('project');
  } catch (error) {
    session.syncStatus = 'FAILED';
    session.lastSyncError = error.message;
    await session.save();
    await markReconnectRequired(user, error);
    throw Object.assign(new Error(error.message), { statusCode: 502, session, providerError: error });
  }
};

export const scheduleSession = async (req, res) => {
  try {
    const session = await createSession({ user: await User.findById(req.user._id), input: req.body });
    res.status(201).json(session);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.statusCode === 502 ? 'Build Day saved, but Google Calendar sync failed.' : error.message,
      error: error.message,
      session: error.session || undefined,
    });
  }
};

export const scheduleSessionsBatch = async (req, res) => {
  const inputs = Array.isArray(req.body?.sessions) ? req.body.sessions : [];
  const atomic = req.body?.atomic !== false;
  if (!inputs.length || inputs.length > MAX_BATCH_SIZE) {
    return res.status(400).json({ message: `Provide between 1 and ${MAX_BATCH_SIZE} sessions.` });
  }
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  try {
    await validateBatchTimelineBounds(user._id, inputs);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message, code: 'TIMELINE_BOUNDARY_VIOLATION' });
  }
  try {
    await verifyCalendarAccess(user);
  } catch (error) {
    await markReconnectRequired(user, error);
    const details = getGoogleCalendarErrorDetails(error);
    return res.status(502).json({
      message: details.message,
      code: details.code,
      actionUrl: details.actionUrl,
      rolledBack: false,
      successful: 0,
      failed: inputs.length,
    });
  }
  const results = [];
  for (let index = 0; index < inputs.length; index += 1) {
    try {
      results.push({ index, success: true, session: await createSession({ user, input: inputs[index] }) });
    } catch (error) {
      results.push({ index, success: false, message: error.message, session: error.session });
      if (atomic) {
        const details = getGoogleCalendarErrorDetails(error.providerError || error);
        const rollbackTargets = [
          ...results.filter(result => result.success).map(result => result.session),
          ...(error.session ? [error.session] : []),
        ];
        const rollbackErrors = [];
        for (const session of rollbackTargets) {
          try {
            if (session.googleEventId) await deleteCalendarEvent(user, session);
          } catch (rollbackError) {
            if (!isGoogleNotFoundError(rollbackError)) rollbackErrors.push(rollbackError.message);
          } finally {
            await BuildSession.deleteOne({ _id: session._id, user: user._id });
          }
        }
        return res.status(502).json({
          message: `${details.message} All sessions created by this attempt were rolled back.`,
          code: details.code,
          actionUrl: details.actionUrl,
          failedAt: index,
          failedSession: {
            title: inputs[index]?.title || `Build Day ${index + 1}`,
            startAt: inputs[index]?.startAt,
          },
          rolledBack: true,
          rollbackErrors,
          results,
        });
      }
    }
  }
  const successful = results.filter(result => result.success).length;
  return res.status(successful === results.length ? 201 : 207).json({
    successful,
    failed: results.length - successful,
    results,
  });
};

export const getSessions = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.startAt = {};
      if (req.query.from) filter.startAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.startAt.$lte = new Date(req.query.to);
    }
    if (req.query.projectId) filter.project = (await findOwnedProject(req.user._id, req.query.projectId))._id;
    const sessions = await BuildSession.find(filter).populate('project').sort({ startAt: 1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching Build Days.' });
  }
};

export const updateSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const session = await BuildSession.findOne({ _id: req.params.sessionId, user: user._id }).populate('project');
    if (!session) return res.status(404).json({ message: 'Build Day not found.' });
    if (session.status === 'CANCELLED') return res.status(409).json({ message: 'Cancelled Build Days cannot be edited.' });

    const data = parseSessionInput({ ...session.toObject(), ...req.body });
    validatePhaseAndTasks(session.project, data);
    Object.assign(session, data, { syncStatus: 'PENDING' });
    await session.save();
    try {
      applyGoogleEvent(session, await updateCalendarEvent(user, session, session.project));
      await session.save();
      res.status(200).json(session);
    } catch (error) {
      session.syncStatus = 'FAILED';
      session.lastSyncError = error.message;
      await session.save();
      await markReconnectRequired(user, error);
      res.status(502).json({ message: 'Changes saved, but Google Calendar sync failed.', session });
    }
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const cancelSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let session = await BuildSession.findOne({ _id: req.params.sessionId, user: user._id });
    if (!session) return res.status(404).json({ message: 'Build Day not found.' });
    session = await hydrateLegacySession(session);
    if (session.googleEventId && session.syncStatus !== 'DELETED') {
      try {
        await deleteCalendarEvent(user, session);
      } catch (error) {
        if (!isGoogleNotFoundError(error)) {
          await markReconnectRequired(user, error);
          throw error;
        }
      }
    }
    session.status = 'CANCELLED';
    session.syncStatus = 'DELETED';
    session.cancelledAt = new Date();
    session.lastSyncError = undefined;
    await session.save();
    res.status(200).json(session);
  } catch (error) {
    res.status(502).json({ message: 'Unable to cancel this Build Day.', error: error.message });
  }
};

export const completeSession = async (req, res) => {
  try {
    const session = await BuildSession.findOne({ _id: req.params.sessionId, user: req.user._id }).populate('project');
    if (!session) return res.status(404).json({ message: 'Build Day not found.' });
    if (session.status === 'CANCELLED') return res.status(409).json({ message: 'A cancelled Build Day cannot be completed.' });
    if (session.status !== 'COMPLETED') {
      session.status = 'COMPLETED';
      session.completedAt = new Date();
      await session.save();
      const targetSkills = session.project.targetSkills?.length
        ? session.project.targetSkills
        : [{ name: 'Coding Consistency', slug: 'coding-consistency' }];
      await SkillProgressEvent.insertMany(targetSkills.map(skill => ({
        user: req.user._id,
        project: session.project._id,
        categorySlug: skill.slug || 'coding-consistency',
        categoryName: skill.name || 'Coding Consistency',
        eventType: 'BUILD_SESSION_COMPLETED',
        title: `Completed Build Day: ${session.title}`,
        description: session.objective || `Completed a focused session for ${session.project.title}.`,
        impactScore: 1,
      })));
    }
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Unable to complete Build Day.', error: error.message });
  }
};

export const retrySessionSync = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const session = await BuildSession.findOne({ _id: req.params.sessionId, user: user._id }).populate('project');
    if (!session) return res.status(404).json({ message: 'Build Day not found.' });
    if (session.status === 'CANCELLED') return res.status(409).json({ message: 'Cancelled Build Days cannot be synced.' });
    let event;
    try {
      event = await updateCalendarEvent(user, session, session.project);
    } catch (error) {
      if (isGoogleNotFoundError(error)) {
        session.syncAttempt += 1;
        session.googleEventId = `${session._id}${session.syncAttempt.toString(32)}`;
        await session.save();
        event = await insertCalendarEvent(user, session, session.project);
      } else throw error;
    }
    applyGoogleEvent(session, event);
    await session.save();
    res.status(200).json(session);
  } catch (error) {
    await markReconnectRequired(await User.findById(req.user._id), error);
    res.status(502).json({ message: 'Google Calendar sync retry failed.', error: error.message });
  }
};

export const reconcileSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json(await reconcileUserSessions(user));
  } catch (error) {
    res.status(502).json({ message: 'Calendar reconciliation failed.', error: error.message });
  }
};
