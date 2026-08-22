import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBuildDayPreview } from '../src/utils/schedulePlanner.js';

const project = {
  projectId: 'PROJECT-1',
  selectedTimeline: 'one-week',
  timelineOptions: [{ id: 'one-week', title: 'One week', duration: '1 week', durationDays: 7 }],
  phases: [{
    phaseId: 'phase-1',
    title: 'API delivery',
    description: 'Build and verify the API',
    estimatedHours: 5,
    suggestedSessionCount: 3,
    tasks: [
      { taskId: 'task-1' }, { taskId: 'task-2' }, { taskId: 'task-3' },
      { taskId: 'task-4' }, { taskId: 'task-5' },
    ],
  }],
};

test('confirmed timeline controls the Build Day count and distributes phase tasks', () => {
  const sessions = generateBuildDayPreview({
    project,
    startDate: '2026-08-24',
    startTime: '18:00',
    duration: '120',
    reminder: '30',
    timeZone: 'Asia/Karachi',
  });

  assert.equal(sessions.length, 7);
  assert.deepEqual(sessions.flatMap(session => session.taskIds), ['task-1', 'task-2', 'task-3', 'task-4', 'task-5']);
  assert.ok(sessions.every(session => new Date(session.endAt) - new Date(session.startAt) === 120 * 60 * 1000));
  assert.equal(new Set(sessions.map(session => session.previewId)).size, 7);
});

test('one-week timeline creates seven Build Days regardless of phase count', () => {
  const phases = Array.from({ length: 5 }, (_, index) => ({
    phaseId: `phase-${index + 1}`,
    title: `Phase ${index + 1}`,
    description: `Complete phase ${index + 1}`,
    estimatedHours: 8,
    suggestedSessionCount: 4,
    tasks: [],
  }));
  const sessions = generateBuildDayPreview({
    project: { ...project, phases },
    startDate: '2026-08-24',
    startTime: '18:00',
    duration: '120',
    reminder: '30',
    timeZone: 'Asia/Karachi',
  });

  const timelineStart = new Date('2026-08-24T00:00:00');
  assert.equal(sessions.length, 7);
  assert.deepEqual(new Set(sessions.map(session => session.phaseId)).size, 5);
  const dayOffsets = sessions.map(session => {
    const dayOffset = Math.floor((new Date(session.startAt) - timelineStart) / (24 * 60 * 60 * 1000));
    return dayOffset;
  });
  assert.deepEqual(dayOffsets, [0, 1, 2, 3, 4, 5, 6]);
  assert.ok(sessions.every(session => session.timelineStartAt));
});

test('planner skips completed phases and rejects incomplete preferences', () => {
  assert.deepEqual(generateBuildDayPreview({ project, startDate: '', startTime: '18:00', duration: 60 }), []);
  assert.deepEqual(generateBuildDayPreview({
    project: { ...project, phases: [{ ...project.phases[0], isCompleted: true }] },
    startDate: '2026-08-24', startTime: '18:00', duration: 60,
  }), []);
});
