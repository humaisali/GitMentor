export const getBuildDayDate = (session, field = 'startAt') => {
  const legacyField = field === 'endAt' ? 'endTime' : 'startTime';
  const value = session?.[field] || session?.[legacyField];
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const formatBuildDayTime = session => {
  const start = getBuildDayDate(session, 'startAt');
  const end = getBuildDayDate(session, 'endAt');
  if (!start || !end) return 'Time unavailable';
  const options = { hour: '2-digit', minute: '2-digit' };
  return `${start.toLocaleTimeString([], options)} – ${end.toLocaleTimeString([], options)}`;
};

export const getBuildDayPhase = (session) => {
  const phases = session?.project?.phases || [];
  const phaseIndex = phases.findIndex(phase => phase.phaseId === session?.phaseId);
  const title = session?.phaseTitle || phases[phaseIndex]?.title;
  if (!title) return null;
  const number = Number(session?.phaseNumber) || phaseIndex + 1;
  const count = Number(session?.phaseCount) || phases.length;
  return {
    title,
    number,
    count,
    label: number > 0 && count > 0 ? `Phase ${number} of ${count} · ${title}` : `Phase · ${title}`,
  };
};
