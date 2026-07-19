import { google } from 'googleapis';
import BuildSession from '../models/BuildSession.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

const getOAuth2Client = (user) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/api/auth/google/callback'
  );

  oAuth2Client.setCredentials({
    refresh_token: user.googleRefreshToken,
  });

  return oAuth2Client;
};

// @desc    Schedule a Build Day session
// @route   POST /api/calendar/schedule
// @access  Private
export const scheduleSession = async (req, res) => {
  try {
    const { projectId, startTime, endTime } = req.body;

    const user = await User.findById(req.user._id);
    if (!user.googleRefreshToken) {
      return res.status(403).json({ message: 'Google Calendar not connected.' });
    }

    const project = await Project.findOne({ projectId, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const oAuth2Client = getOAuth2Client(user);
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const event = {
      summary: `GitMentor Build Day: ${project.title}`,
      description: `Focus session for GitMentor Project: ${project.title}\n\nDescription: ${project.description}`,
      start: {
        dateTime: new Date(startTime).toISOString(),
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
      },
      colorId: '9', // Blueberry color
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    const buildSession = await BuildSession.create({
      user: req.user._id,
      project: project._id,
      title: event.summary,
      startTime,
      endTime,
      googleEventId: response.data.id,
    });

    res.status(201).json(buildSession);
  } catch (error) {
    console.error('Error scheduling session:', error);
    res.status(500).json({ message: 'Failed to schedule session on Google Calendar', error: error.message });
  }
};

// @desc    Get user's scheduled Build Sessions
// @route   GET /api/calendar/sessions
// @access  Private
export const getSessions = async (req, res) => {
  try {
    const sessions = await BuildSession.find({ user: req.user._id }).populate('project').sort({ startTime: 1 });
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching build sessions' });
  }
};
