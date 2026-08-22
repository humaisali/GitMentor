import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { calendarApi } from '../../services/calendarApi';

export const NextBuildDayWidget = () => {
  const [session, setSession] = useState(null);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      calendarApi.list(`?from=${encodeURIComponent(new Date().toISOString())}&status=SCHEDULED`),
      calendarApi.connectionStatus(),
    ]).then(([sessions, status]) => {
      if (!active) return;
      setSession(sessions[0] || null);
      setConnected(status.connected);
    }).catch(() => {
      if (active) setConnected(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-muted-cyan/10 border border-muted-cyan/20 flex items-center justify-center shrink-0"><CalendarClock size={20} className="text-muted-cyan" /></div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-steel">Next Build Day</p>
            {session && <Badge variant="primary">SCHEDULED</Badge>}
          </div>
          <h2 className="text-base font-medium text-canvas-white mt-1 truncate">{session?.title || (connected ? 'No focus session scheduled' : 'Connect Google Calendar')}</h2>
          <p className="text-xs font-mono text-muted-steel mt-1">
            {session ? `${new Date(session.startAt).toLocaleDateString()} · ${new Date(session.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Protect time for your next roadmap milestone.'}
          </p>
        </div>
      </div>
      <Link to="/build-days" className="inline-flex items-center gap-2 text-sm text-muted-cyan hover:text-blue-300 shrink-0">Open Build Days <ArrowRight size={15} /></Link>
    </Card>
  );
};
