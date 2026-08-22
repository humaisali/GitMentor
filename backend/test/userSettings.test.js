import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_USER_PREFERENCES,
  getMentorPromptPreferences,
  normalizeUserPreferences,
} from '../src/utils/userSettings.js';

test('user settings apply complete defaults for existing accounts', () => {
  assert.deepEqual(normalizeUserPreferences(), DEFAULT_USER_PREFERENCES);
});

test('user settings merge partial updates without dropping other sections', () => {
  const preferences = normalizeUserPreferences({}, {
    general: { timeZone: 'Asia/Karachi' },
    mentor: { style: 'GUIDED' },
    buildDays: { workingDays: [6, 1, 1, 3] },
  });

  assert.equal(preferences.general.timeZone, 'Asia/Karachi');
  assert.equal(preferences.mentor.style, 'GUIDED');
  assert.equal(preferences.mentor.explanationDepth, 'STANDARD');
  assert.deepEqual(preferences.buildDays.workingDays, [1, 3, 6]);
});

test('user settings reject invalid timezones and empty working-day selections', () => {
  assert.throws(() => normalizeUserPreferences({}, { general: { timeZone: 'Mars/Olympus' } }), /valid IANA timezone/);
  assert.throws(() => normalizeUserPreferences({}, { buildDays: { workingDays: [] } }), /Too small|at least/i);
});

test('mentor preferences produce concrete prompt behavior', () => {
  const instruction = getMentorPromptPreferences({
    mentor: { style: 'DIRECT', explanationDepth: 'CONCISE', codeGuidance: 'COMPLETE_EXAMPLES' },
  });
  assert.match(instruction, /recommended implementation/);
  assert.match(instruction, /brief/);
  assert.match(instruction, /complete, usable code/);
});
