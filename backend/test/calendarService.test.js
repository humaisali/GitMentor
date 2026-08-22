import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptToken, decryptToken } from '../src/utils/tokenCrypto.js';
import { buildGoogleEvent, getGoogleCalendarErrorDetails, isGoogleCredentialError } from '../src/services/googleCalendarService.js';
import { getTimelineDurationDays, parseSessionInput } from '../src/controllers/calendarController.js';
import { buildFallbackPhaseTasks } from '../src/controllers/roadmapController.js';

test('Google refresh tokens are encrypted and decryptable', () => {
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = 'test-only-calendar-encryption-secret';
  const plainText = 'refresh-token-value';
  const encrypted = encryptToken(plainText);

  assert.notEqual(encrypted, plainText);
  assert.match(encrypted, /^enc:v1:/);
  assert.equal(decryptToken(encrypted), plainText);
});

test('Google event payload preserves timezone, reminders, and GitMentor identity', () => {
  const session = {
    _id: { toString: () => '64b7f1a2c3d4e5f607182930' },
    title: 'GitMentor Build Day: API phase',
    phaseId: 'P2',
    phaseTitle: 'API delivery',
    phaseNumber: 2,
    phaseCount: 4,
    objective: 'Ship the REST API',
    milestone: 'Endpoints verified',
    notes: 'Run integration tests',
    startAt: new Date('2026-08-24T13:00:00.000Z'),
    endAt: new Date('2026-08-24T15:00:00.000Z'),
    timeZone: 'Asia/Karachi',
    reminderMinutes: [30],
  };
  const project = { title: 'Portfolio API', projectId: 'MOD-1' };
  const event = buildGoogleEvent(session, project, { includeId: true });

  assert.equal(event.id, '64b7f1a2c3d4e5f607182930');
  assert.equal(event.start.timeZone, 'Asia/Karachi');
  assert.deepEqual(event.reminders.overrides, [{ method: 'popup', minutes: 30 }]);
  assert.equal(event.extendedProperties.private.gitmentorProjectId, 'MOD-1');
  assert.equal(event.extendedProperties.private.gitmentorPhaseId, 'P2');
  assert.match(event.description, /Ship the REST API/);
  assert.match(event.description, /Phase 2 of 4 — API delivery/);
});

test('Build Day input validation rejects invalid ranges and timezones', () => {
  assert.throws(() => parseSessionInput({
    startAt: '2026-08-24T15:00:00.000Z',
    endAt: '2026-08-24T14:00:00.000Z',
    timeZone: 'Asia/Karachi',
  }), /End time must be after start time/);

  assert.throws(() => parseSessionInput({
    startAt: '2026-08-24T13:00:00.000Z',
    endAt: '2026-08-24T15:00:00.000Z',
    timeZone: 'Mars/Olympus',
  }), /valid IANA timezone/);
});

test('credential failures are distinguished from ordinary Calendar errors', () => {
  assert.equal(isGoogleCredentialError({ response: { status: 401 } }), true);
  assert.equal(isGoogleCredentialError({ response: { data: { error: 'invalid_grant' } } }), true);
  assert.equal(isGoogleCredentialError({ response: { status: 400, data: { error: 'invalid_token' } } }), true);
  assert.equal(isGoogleCredentialError({ response: { status: 429 } }), false);
});

test('phase task fallback produces stable actionable tasks', () => {
  const tasks = buildFallbackPhaseTasks({ phaseId: 'P3', title: 'API hardening', description: 'Secure the API.' });
  assert.equal(tasks.length, 4);
  assert.deepEqual(tasks.map(task => task.taskId), ['P3-T1', 'P3-T2', 'P3-T3', 'P3-T4']);
  assert.ok(tasks.every(task => task.steps.length >= 3));
});

test('disabled Calendar API errors become actionable setup guidance', () => {
  const details = getGoogleCalendarErrorDetails({
    response: {
      data: {
        error: {
          details: [{
            reason: 'SERVICE_DISABLED',
            metadata: { consumer: 'projects/12345', activationUrl: 'https://console.example/calendar' },
          }],
        },
      },
    },
  });
  assert.equal(details.code, 'CALENDAR_API_DISABLED');
  assert.match(details.message, /12345/);
  assert.equal(details.actionUrl, 'https://console.example/calendar');
});

test('timeline duration uses explicit days and supports legacy week labels', () => {
  assert.equal(getTimelineDurationDays({ duration: '1 week', durationDays: 7 }), 7);
  assert.equal(getTimelineDurationDays({ duration: '2 weeks' }), 14);
  assert.equal(getTimelineDurationDays({ duration: '10 days' }), 10);
});
