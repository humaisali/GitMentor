import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBuildDayPreview } from '../src/utils/schedulePlanner.js';

const project = {
  projectId: 'PROJECT-1',
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

test('planner expands phase effort into multiple sessions and distributes tasks', () => {
  const sessions = generateBuildDayPreview({
    project,
    startDate: '2026-08-24',
    startTime: '18:00',
    duration: '120',
    weekdays: [1, 3, 5],
    reminder: '30',
    timeZone: 'Asia/Karachi',
  });

  assert.equal(sessions.length, 3);
  assert.deepEqual(sessions.flatMap(session => session.taskIds), ['task-1', 'task-2', 'task-3', 'task-4', 'task-5']);
  assert.ok(sessions.every(session => [1, 3, 5].includes(new Date(session.startAt).getDay())));
  assert.ok(sessions.every(session => new Date(session.endAt) - new Date(session.startAt) === 120 * 60 * 1000));
  assert.equal(new Set(sessions.map(session => session.previewId)).size, 3);
});

test('planner skips completed phases and rejects incomplete preferences', () => {
  assert.deepEqual(generateBuildDayPreview({ project, startDate: '', startTime: '18:00', duration: 60, weekdays: [1] }), []);
  assert.deepEqual(generateBuildDayPreview({
    project: { ...project, phases: [{ ...project.phases[0], isCompleted: true }] },
    startDate: '2026-08-24', startTime: '18:00', duration: 60, weekdays: [1],
  }), []);
});
