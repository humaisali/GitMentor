const distributeTasks = (tasks, sessionIndex, sessionCount) => {
  if (!tasks.length) return [];
  const chunkSize = Math.ceil(tasks.length / sessionCount);
  return tasks.slice(sessionIndex * chunkSize, (sessionIndex + 1) * chunkSize).map(task => task.taskId);
};

export const generateBuildDayPreview = ({ project, startDate, startTime, duration, weekdays, reminder, timeZone }) => {
  if (!project?.phases?.length || !weekdays?.length || !startDate || !startTime) return [];

  const cursor = new Date(`${startDate}T${startTime}`);
  if (Number.isNaN(cursor.getTime())) return [];
  const allowedDays = new Set(weekdays.map(Number));
  const durationMinutes = Math.max(30, Number(duration) || 120);
  const durationHours = durationMinutes / 60;
  const sessions = [];

  project.phases.filter(phase => !phase.isCompleted).forEach(phase => {
    const openTasks = (phase.tasks || []).filter(task => !task.isCompleted);
    const inferredCount = Math.ceil((Number(phase.estimatedHours) || durationHours) / durationHours);
    const sessionCount = Math.max(1, Number(phase.suggestedSessionCount) || inferredCount);

    for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
      let safety = 0;
      while (!allowedDays.has(cursor.getDay()) && safety < 14) {
        cursor.setDate(cursor.getDate() + 1);
        safety += 1;
      }
      const startAt = new Date(cursor);
      const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
      sessions.push({
        projectId: project.projectId,
        phaseId: phase.phaseId,
        taskIds: distributeTasks(openTasks, sessionIndex, sessionCount),
        title: `GitMentor Build Day: ${phase.title} (${sessionIndex + 1}/${sessionCount})`,
        objective: sessionCount > 1 ? `${phase.description} — focus session ${sessionIndex + 1} of ${sessionCount}.` : phase.description,
        milestone: `Complete session ${sessionIndex + 1} of ${sessionCount} for ${phase.title}`,
        notes: `Estimated phase effort: ${phase.estimatedHours || phase.estimatedTime || 'Flexible'}${phase.estimatedHours ? ' hours' : ''}`,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        reminderMinutes: [Number(reminder) || 30],
        previewId: `${phase.phaseId}-${sessionIndex}`,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return sessions;
};
