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
  const weights = phases.map(phase => Math.max(
    1,
    Number(phase.suggestedSessionCount) || 0,
    Math.ceil((Number(phase.estimatedHours) || durationHours) / durationHours)
  ));
  const allocated = phases.map(() => 0);

  for (let index = 0; index < Math.min(phases.length, availableSlots); index += 1) allocated[index] = 1;
  for (let remaining = availableSlots - allocated.reduce((sum, count) => sum + count, 0); remaining > 0; remaining -= 1) {
    let selectedIndex = 0;
    let lowestCoverage = Number.POSITIVE_INFINITY;
    weights.forEach((weight, index) => {
      const coverage = allocated[index] / weight;
      if (coverage < lowestCoverage) {
        lowestCoverage = coverage;
        selectedIndex = index;
      }
    });
    allocated[selectedIndex] += 1;
  }
  return allocated;
};

export const getPhaseTimelineAllocations = (project) => {
  const timeline = getSelectedTimeline(project);
  const phases = project?.phases || [];
  if (!timeline || !phases.length) return [];
  const stored = phases.map(phase => Number(phase.allocatedDays));
  const hasValidStoredAllocation = stored.every(value => Number.isInteger(value) && value >= 0)
    && stored.reduce((sum, count) => sum + count, 0) === timeline.durationDays;
  return hasValidStoredAllocation
    ? stored
    : allocatePhaseSessions(phases, timeline.durationDays, 2);
};

const buildTimelineDates = (startDate, durationDays, workingDays = []) => {
  const allowedDays = new Set(
    Array.isArray(workingDays) && workingDays.length > 0
      ? workingDays.map(Number)
      : [0, 1, 2, 3, 4, 5, 6]
  );
  const dates = [];
  let cursor = new Date(startDate);
  for (let attempts = 0; dates.length < durationDays && attempts < 370; attempts += 1) {
    if (allowedDays.has(cursor.getDay())) dates.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return dates;
};

export const generateBuildDayPreview = ({ project, startDate, startTime, duration, reminder, timeZone, workingDays }) => {
  if (!project?.phases?.length || !startDate || !startTime) return [];

  const firstSessionDate = new Date(`${startDate}T${startTime}`);
  const timelineStart = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(firstSessionDate.getTime()) || Number.isNaN(timelineStart.getTime())) return [];
  const timeline = getSelectedTimeline(project);
  if (!timeline) return [];

  const activePhases = project.phases.filter(phase => !phase.isCompleted);
  const durationMinutes = Math.max(30, Number(duration) || 120);
  const durationHours = durationMinutes / 60;
  const timelineDates = buildTimelineDates(firstSessionDate, timeline.durationDays, workingDays);
  const projectAllocations = getPhaseTimelineAllocations(project);
  const allPhasesActive = activePhases.length === project.phases.length;
  const allocations = allPhasesActive
    ? projectAllocations
    : allocatePhaseSessions(activePhases, timelineDates.length, durationHours);
  const sessions = [];
  let dateIndex = 0;

  activePhases.forEach((phase, phaseIndex) => {
    const sessionCount = allocations[phaseIndex];
    const roadmapPhaseIndex = project.phases.findIndex(item => item.phaseId === phase.phaseId);
    const phaseNumber = roadmapPhaseIndex + 1;
    const phaseCount = project.phases.length;
    const openTasks = (phase.tasks || []).filter(task => !task.isCompleted);
    for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
      const scheduledDate = timelineDates[dateIndex];
      const startAt = new Date(scheduledDate);
      startAt.setHours(firstSessionDate.getHours(), firstSessionDate.getMinutes(), 0, 0);
      const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
      sessions.push({
        projectId: project.projectId,
        phaseId: phase.phaseId,
        phaseTitle: phase.title,
        phaseNumber,
        phaseCount,
        taskIds: distributeTasks(openTasks, sessionIndex, sessionCount),
        title: `GitMentor Build Day: Phase ${phaseNumber} of ${phaseCount} · ${phase.title} (${sessionIndex + 1}/${sessionCount})`,
        objective: sessionCount > 1 ? `${phase.description}. Focus session ${sessionIndex + 1} of ${sessionCount}.` : phase.description,
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
