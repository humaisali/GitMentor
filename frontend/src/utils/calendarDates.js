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
