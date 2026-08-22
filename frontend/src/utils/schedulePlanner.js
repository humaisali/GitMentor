const distributeTasks = (tasks, sessionIndex, sessionCount) => {
  if (!tasks.length) return [];
  const chunkSize = Math.ceil(tasks.length / sessionCount);
  return tasks.slice(sessionIndex * chunkSize, (sessionIndex + 1) * chunkSize).map(task => task.taskId);
};

const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

export const getSelectedTimeline = (project) => {
  const timeline = project?.timelineOptions?.find(option => option.id === project.selectedTimeline);
  if (!timeline) return null;
  const durationText = String(timeline.duration || '');
  const value = Number.parseInt(durationText, 10);
  const inferredDays = /week/i.test(durationText) ? value * 7 : value;
  return {
    ...timeline,
    durationDays: Math.max(1, Number(timeline.durationDays) || inferredDays || 1),
  };
};

const allocatePhaseSessions = (phases, availableSlots, durationHours) => {
  if (!phases.length || availableSlots <= 0) return [];
  const desired = phases.map(phase => Math.max(
    1,
    Number(phase.suggestedSessionCount)
      || Math.ceil((Number(phase.estimatedHours) || durationHours) / durationHours)
  ));
  const totalDesired = desired.reduce((sum, count) => sum + count, 0);
  const target = Math.min(totalDesired, availableSlots);
  const allocated = phases.map(() => 0);

  for (let index = 0; index < Math.min(phases.length, target); index += 1) allocated[index] = 1;
  for (let remaining = target - allocated.reduce((sum, count) => sum + count, 0); remaining > 0; remaining -= 1) {
    let selectedIndex = 0;
    let largestGap = -1;
    desired.forEach((count, index) => {
      const gap = count - allocated[index];
      if (gap > largestGap) {
        largestGap = gap;
        selectedIndex = index;
      }
    });
    allocated[selectedIndex] += 1;
  }
  return allocated;
};

const buildTimelineDates = (startDate, durationDays, allowedDays, minimumSlots) => {
  const allDates = Array.from({ length: durationDays }, (_, index) => addDays(startDate, index));
  const preferred = allDates.filter(date => allowedDays.has(date.getDay()));
  if (preferred.length >= minimumSlots) return preferred;
  const preferredKeys = new Set(preferred.map(date => date.toDateString()));
  return [...preferred, ...allDates.filter(date => !preferredKeys.has(date.toDateString()))]
    .sort((left, right) => left - right)
    .slice(0, Math.min(durationDays, minimumSlots));
};

export const generateBuildDayPreview = ({ project, startDate, startTime, duration, weekdays, reminder, timeZone }) => {
  if (!project?.phases?.length || !weekdays?.length || !startDate || !startTime) return [];

  const firstSessionDate = new Date(`${startDate}T${startTime}`);
  const timelineStart = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(firstSessionDate.getTime()) || Number.isNaN(timelineStart.getTime())) return [];
  const timeline = getSelectedTimeline(project);
  if (!timeline) return [];

  const activePhases = project.phases.filter(phase => !phase.isCompleted);
  const allowedDays = new Set(weekdays.map(Number));
  const durationMinutes = Math.max(30, Number(duration) || 120);
  const durationHours = durationMinutes / 60;
  const timelineDates = buildTimelineDates(firstSessionDate, timeline.durationDays, allowedDays, activePhases.length);
  const allocations = allocatePhaseSessions(activePhases, timelineDates.length, durationHours);
  const sessions = [];
  let dateIndex = 0;

  activePhases.forEach((phase, phaseIndex) => {
    const sessionCount = allocations[phaseIndex];
    const openTasks = (phase.tasks || []).filter(task => !task.isCompleted);
    for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
      const scheduledDate = timelineDates[dateIndex];
      const startAt = new Date(scheduledDate);
      startAt.setHours(firstSessionDate.getHours(), firstSessionDate.getMinutes(), 0, 0);
      const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
      sessions.push({
        projectId: project.projectId,
        phaseId: phase.phaseId,
        taskIds: distributeTasks(openTasks, sessionIndex, sessionCount),
        title: `GitMentor Build Day: ${phase.title} (${sessionIndex + 1}/${sessionCount})`,
        objective: sessionCount > 1 ? `${phase.description} — focus session ${sessionIndex + 1} of ${sessionCount}.` : phase.description,
        milestone: `Complete session ${sessionIndex + 1} of ${sessionCount} for ${phase.title}`,
        notes: `Confirmed project timeline: ${timeline.duration || `${timeline.durationDays} days`}. Estimated phase effort was compressed to fit this window.`,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        timelineStartAt: timelineStart.toISOString(),
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        reminderMinutes: [Number(reminder) || 30],
        previewId: `${phase.phaseId}-${sessionIndex}`,
      });
      dateIndex += 1;
    }
  });

  return sessions;
};
