import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBuildDayTime, getBuildDayDate, getBuildDayPhase } from '../src/utils/calendarDates.js';

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

test('Build Days expose explicit phase context for current and legacy sessions', () => {
  assert.deepEqual(getBuildDayPhase({ phaseTitle: 'API delivery', phaseNumber: 2, phaseCount: 4 }), {
    title: 'API delivery', number: 2, count: 4, label: 'Phase 2 of 4 · API delivery',
  });
  assert.deepEqual(getBuildDayPhase({
    phaseId: 'P2',
    project: { phases: [{ phaseId: 'P1', title: 'Design' }, { phaseId: 'P2', title: 'API delivery' }] },
  }), {
    title: 'API delivery', number: 2, count: 2, label: 'Phase 2 of 2 · API delivery',
  });
});
