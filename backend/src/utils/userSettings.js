import { z } from 'zod';

export const CAREER_TRACK_IDS = [
  'frontend-developer',
  'backend-developer',
  'full-stack-developer',
  'ai-app-developer',
  'devops-beginner',
  'open-source-contributor',
];

export const DEFAULT_USER_PREFERENCES = {
  general: {
    timeZone: 'UTC',
    weekStartsOn: 1,
  },
  buildDays: {
    startTime: '18:00',
    durationMinutes: 120,
    reminderMinutes: 30,
    workingDays: [1, 2, 3, 4, 5],
  },
  mentor: {
    style: 'BALANCED',
    explanationDepth: 'STANDARD',
    codeGuidance: 'HINTS_FIRST',
  },
  skillEngine: {
    targetRole: 'full-stack-developer',
  },
};

const isValidTimeZone = value => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

const userPreferencesSchema = z.object({
  general: z.object({
    timeZone: z.string().min(1).refine(isValidTimeZone, 'Choose a valid IANA timezone.'),
    weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  }),
  buildDays: z.object({
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid 24-hour start time.'),
    durationMinutes: z.union([z.literal(60), z.literal(90), z.literal(120), z.literal(180)]),
    reminderMinutes: z.union([z.literal(10), z.literal(30), z.literal(60), z.literal(1440)]),
    workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7)
      .transform(days => [...new Set(days)].sort((left, right) => left - right)),
  }),
  mentor: z.object({
    style: z.enum(['GUIDED', 'BALANCED', 'DIRECT']),
    explanationDepth: z.enum(['CONCISE', 'STANDARD', 'DETAILED']),
    codeGuidance: z.enum(['HINTS_FIRST', 'COMPLETE_EXAMPLES']),
  }),
  skillEngine: z.object({
    targetRole: z.enum(CAREER_TRACK_IDS),
  }),
});

const copyDefaults = () => JSON.parse(JSON.stringify(DEFAULT_USER_PREFERENCES));

export const normalizeUserPreferences = (stored = {}, incoming = {}) => {
  const defaults = copyDefaults();
  const merged = {
    general: { ...defaults.general, ...(stored?.general || {}), ...(incoming?.general || {}) },
    buildDays: { ...defaults.buildDays, ...(stored?.buildDays || {}), ...(incoming?.buildDays || {}) },
    mentor: { ...defaults.mentor, ...(stored?.mentor || {}), ...(incoming?.mentor || {}) },
    skillEngine: { ...defaults.skillEngine, ...(stored?.skillEngine || {}), ...(incoming?.skillEngine || {}) },
  };

  const result = userPreferencesSchema.safeParse(merged);
  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Invalid settings.');
    error.statusCode = 400;
    error.issues = result.error.issues;
    throw error;
  }
  return result.data;
};

export const getMentorPromptPreferences = preferences => {
  const normalized = normalizeUserPreferences(preferences);
  const style = {
    GUIDED: 'Use a coaching style: ask a useful question or provide a small hint before revealing a complete solution.',
    BALANCED: 'Balance concise explanation, practical direction, and implementation examples.',
    DIRECT: 'Lead with the recommended implementation and the concrete next steps.',
  }[normalized.mentor.style];
  const depth = {
    CONCISE: 'Keep the response brief and focused on the immediate decision or next action.',
    STANDARD: 'Give enough reasoning to make the recommendation understandable without unnecessary background.',
    DETAILED: 'Explain the reasoning, tradeoffs, edge cases, and verification approach in useful detail.',
  }[normalized.mentor.explanationDepth];
  const code = normalized.mentor.codeGuidance === 'HINTS_FIRST'
    ? 'Prefer targeted hints and small code excerpts before a complete implementation unless the user explicitly asks for the full solution.'
    : 'Provide complete, usable code examples when implementation guidance is requested.';

  return `${style} ${depth} ${code}`;
};
