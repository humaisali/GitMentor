import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBuildDayTime, getBuildDayDate } from '../src/utils/calendarDates.js';

test('Build Day dates support legacy startTime and endTime fields', () => {
  const session = {
    startTime: '2026-06-27T07:01:00.000Z',
    endTime: '2026-06-27T09:01:00.000Z',
  };
  assert.equal(getBuildDayDate(session)?.toISOString(), session.startTime);
  assert.notEqual(formatBuildDayTime(session), 'Time unavailable');
});

test('invalid Build Day dates never expose NaN to React children', () => {
  const date = getBuildDayDate({ startAt: 'not-a-date' });
  assert.equal(date, null);
  assert.equal(formatBuildDayTime({}), 'Time unavailable');
});
