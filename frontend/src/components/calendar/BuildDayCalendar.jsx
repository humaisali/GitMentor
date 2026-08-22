import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { getBuildDayDate } from '../../utils/calendarDates';

const sameDay = (left, right) => left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
const startOfWeek = (date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - result.getDay());
  return result;
};
const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const EventChip = ({ session, onSelect }) => (
  <button type="button" onClick={() => onSelect(session)} title={session.title} className={`w-full text-left rounded-md px-1.5 py-1 text-[10px] font-mono truncate border ${session.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : session.status === 'CANCELLED' ? 'bg-white/[0.03] border-white/[0.06] text-muted-steel line-through' : 'bg-muted-cyan/10 border-muted-cyan/20 text-muted-cyan'}`}>
    {getBuildDayDate(session)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Time unavailable'} {session.title}
  </button>
);

export const BuildDayCalendar = ({ sessions, view, onSelect }) => {
  const [cursor, setCursor] = useState(() => new Date());
  const [today] = useState(() => new Date());
  const days = useMemo(() => {
    if (view === 'WEEK') {
      const start = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [cursor, view]);

  const move = (direction) => setCursor(current => {
    const next = new Date(current);
    if (view === 'WEEK') next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    return next;
  });
  const label = view === 'WEEK'
    ? `${days[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
    : cursor.toLocaleDateString([], { month: 'long', year: 'numeric' });

  return (
    <Card hover={false} className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <button type="button" onClick={() => move(-1)} className="p-2 text-muted-steel hover:text-canvas-white" aria-label={`Previous ${view.toLowerCase()}`}><ChevronLeft size={17} /></button>
        <button type="button" onClick={() => setCursor(new Date())} className="text-sm font-medium text-canvas-white hover:text-muted-cyan">{label}</button>
        <button type="button" onClick={() => move(1)} className="p-2 text-muted-steel hover:text-canvas-white" aria-label={`Next ${view.toLowerCase()}`}><ChevronRight size={17} /></button>
      </div>
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2 text-center text-[10px] font-mono uppercase text-muted-steel">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map(day => {
          const daySessions = sessions.filter(session => {
            const start = getBuildDayDate(session);
            return start ? sameDay(start, day) : false;
          });
          const outsideMonth = view === 'MONTH' && day.getMonth() !== cursor.getMonth();
          return (
            <div key={day.toISOString()} className={`${view === 'WEEK' ? 'min-h-72' : 'min-h-28'} p-1.5 border-r border-b border-white/[0.05] ${outsideMonth ? 'opacity-35' : ''}`}>
              <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] font-mono ${sameDay(day, today) ? 'bg-muted-cyan text-bg-base font-semibold' : 'text-muted-steel'}`}>{day.getDate()}</span>
              <div className="space-y-1 mt-1">{daySessions.slice(0, view === 'WEEK' ? 12 : 3).map(session => <EventChip key={session._id} session={session} onSelect={onSelect} />)}</div>
              {view === 'MONTH' && daySessions.length > 3 && <p className="text-[10px] text-muted-steel mt-1">+{daySessions.length - 3} more</p>}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
