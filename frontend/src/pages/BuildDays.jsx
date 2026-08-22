import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, CalendarClock, CalendarDays, Check, ExternalLink, List, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { BuildDayModal } from '../components/calendar/BuildDayModal';
import { AutoScheduleModal } from '../components/calendar/AutoScheduleModal';
import { BuildDayCalendar } from '../components/calendar/BuildDayCalendar';
import { calendarApi } from '../services/calendarApi';
import { apiRequest } from '../services/apiClient';
import { formatBuildDayTime, getBuildDayDate, getBuildDayPhase } from '../utils/calendarDates';

const statusVariant = { SCHEDULED: 'primary', COMPLETED: 'success', CANCELLED: 'default' };

const SessionCard = ({ session, onEdit, onComplete, onCancel, onRetry }) => {
  const start = getBuildDayDate(session, 'startAt');
  const phase = getBuildDayPhase(session);
  return (
    <Card className={`p-5 ${session.status === 'CANCELLED' ? 'opacity-50' : ''}`}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex gap-4 min-w-0">
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-muted-cyan/10 border border-muted-cyan/20 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-muted-cyan uppercase">{start ? start.toLocaleString([], { month: 'short' }) : 'TBD'}</span>
          <span className="text-xl font-semibold text-canvas-white leading-none">{start ? String(start.getDate()) : '—'}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-medium text-canvas-white truncate">{session.title}</h3>
            <Badge variant={statusVariant[session.status]}>{session.status}</Badge>
            {phase && <Badge variant="outline">PHASE {phase.number} OF {phase.count}</Badge>}
            {session.syncStatus === 'FAILED' && <Badge variant="error">SYNC FAILED</Badge>}
          </div>
          <p className="text-xs font-mono text-muted-cyan">
            {formatBuildDayTime(session)}
            <span className="text-muted-steel"> · {session.timeZone}</span>
          </p>
          {phase && <p className="text-xs font-mono text-muted-cyan mt-2">Roadmap phase · {phase.title}</p>}
          <p className="text-sm text-muted-steel mt-2 line-clamp-2">{session.objective || session.milestone || session.projectTitle}</p>
          <p className="text-[11px] font-mono text-muted-steel/70 mt-2">{session.project?.title || session.projectTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
        {session.syncStatus === 'FAILED' && <Button variant="ghost" className="px-2" title="Retry sync" onClick={() => onRetry(session)}><RefreshCw size={15} /></Button>}
        {session.googleEventUrl && <a href={session.googleEventUrl} target="_blank" rel="noreferrer" className="p-2 rounded-xl text-muted-steel hover:text-muted-cyan hover:bg-white/[0.06]" title="Open in Google Calendar"><ExternalLink size={15} /></a>}
        {session.status === 'SCHEDULED' && (
          <>
            <Button variant="ghost" className="px-2" title="Edit" onClick={() => onEdit(session)}><Pencil size={15} /></Button>
            <Button variant="ghost" className="px-2 text-emerald-400" title="Complete" onClick={() => onComplete(session)}><Check size={16} /></Button>
            <Button variant="ghost" className="px-2 text-red-400" title="Cancel" onClick={() => onCancel(session)}><Trash2 size={15} /></Button>
          </>
        )}
      </div>
    </div>
    </Card>
  );
};

const BuildDays = () => {
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('UPCOMING');
  const [view, setView] = useState('LIST');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [modal, setModal] = useState(() => {
    const projectId = searchParams.get('projectId');
    const phaseId = searchParams.get('phaseId');
    const mode = searchParams.get('mode');
    return projectId ? { type: mode === 'auto' ? 'auto' : 'manual', projectId, phaseId } : null;
  });
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [now] = useState(() => Date.now());

  const loadData = useCallback(async () => {
    try {
      const [sessionData, projectData, connectionData] = await Promise.all([
        calendarApi.list(), apiRequest('/roadmaps'), calendarApi.connectionStatus(),
      ]);
      setSessions(sessionData);
      setProjects(projectData);
      setConnection(connectionData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([calendarApi.list(), apiRequest('/roadmaps'), calendarApi.connectionStatus()])
      .then(([sessionData, projectData, connectionData]) => {
        if (!active) return;
        setSessions(sessionData);
        setProjects(projectData);
        setConnection(connectionData);
      })
      .catch(error => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleSessions = useMemo(() => {
    const projectSessions = projectFilter === 'ALL' ? sessions : sessions.filter(item => item.projectId === projectFilter);
    if (filter === 'UPCOMING') return projectSessions.filter(item => item.status === 'SCHEDULED' && new Date(item.endAt).getTime() >= now);
    if (filter === 'COMPLETED') return projectSessions.filter(item => item.status === 'COMPLETED');
    return projectSessions;
  }, [filter, sessions, now, projectFilter]);

  const stats = useMemo(() => ({
    upcoming: sessions.filter(item => item.status === 'SCHEDULED' && new Date(item.endAt).getTime() >= now).length,
    completed: sessions.filter(item => item.status === 'COMPLETED').length,
    synced: sessions.filter(item => item.syncStatus === 'SYNCED').length,
  }), [sessions, now]);

  const connectGoogle = async () => {
    try {
      const { authorizationUrl } = await calendarApi.connect('/build-days');
      window.location.href = authorizationUrl;
    } catch (error) {
      setMessage(error.message);
    }
  };

  const runAction = async (action, successMessage, propagateError = false) => {
    setWorking(true);
    setMessage('');
    try {
      const result = await action();
      setMessage(result?.syncWarning || (result?.failed ? `${result.successful} Build Days scheduled; ${result.failed} could not be synced.` : successMessage));
      await loadData();
    } catch (error) {
      setMessage(error.message);
      await loadData();
      if (propagateError) throw error;
    } finally {
      setWorking(false);
    }
  };

  const cancel = async (session) => {
    if (!window.confirm(`Cancel “${session.title}” and remove it from Google Calendar?`)) return;
    await runAction(() => calendarApi.cancel(session._id), 'Build Day cancelled.');
  };

  const reconcile = () => runAction(() => calendarApi.reconcile(), 'Calendar synchronization checked.');

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Build <span className="bg-gradient-to-r from-muted-cyan to-blue-400 bg-clip-text text-transparent">Days</span></h1>
          <p className="text-muted-steel mt-1 font-mono text-sm">Turn roadmap milestones into protected focus time.</p>
        </div>
        {connection?.connected && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={reconcile} disabled={working} className="gap-2"><RefreshCw size={15} /> Sync</Button>
            <Button variant="secondary" onClick={() => setModal({ type: 'auto' })} className="gap-2"><Sparkles size={15} /> Auto-plan</Button>
            <Button onClick={() => setModal({ type: 'manual' })} className="gap-2"><Plus size={16} /> Schedule</Button>
          </div>
        )}
      </header>

      {message && <div className="glass-surface px-4 py-3 text-sm text-muted-steel border-muted-cyan/20">{message}</div>}

      {!loading && !connection?.connected ? (
        <Card hover={false} className="p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-muted-cyan/10 border border-muted-cyan/20 flex items-center justify-center mb-5"><CalendarClock size={30} className="text-muted-cyan" /></div>
          <h2 className="text-xl font-medium text-canvas-white">Connect Google Calendar</h2>
          <p className="text-sm text-muted-steel max-w-md mt-2 mb-6">GitMentor needs Calendar event access to schedule roadmap Build Days and reminders.</p>
          <Button onClick={connectGoogle}>{connection?.status === 'RECONNECT_REQUIRED' ? 'Reconnect Calendar' : 'Connect Calendar'}</Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? [1, 2, 3].map(item => <Skeleton key={item} className="h-24" />) : (
              <>
                <Card className="p-5"><p className="text-[10px] font-mono uppercase tracking-wider text-muted-steel">Upcoming</p><p className="text-3xl font-semibold text-canvas-white mt-2">{stats.upcoming}</p></Card>
                <Card className="p-5"><p className="text-[10px] font-mono uppercase tracking-wider text-muted-steel">Completed</p><p className="text-3xl font-semibold text-emerald-400 mt-2">{stats.completed}</p></Card>
                <Card className="p-5"><p className="text-[10px] font-mono uppercase tracking-wider text-muted-steel">Calendar Synced</p><p className="text-3xl font-semibold text-muted-cyan mt-2">{stats.synced}</p></Card>
              </>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              {['UPCOMING', 'COMPLETED', 'ALL'].map(value => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${filter === value ? 'bg-muted-cyan/10 text-muted-cyan border border-muted-cyan/20' : 'text-muted-steel border border-transparent hover:text-canvas-white'}`}>{value}</button>)}
            </div>
            <div className="flex items-center gap-2">
              <select value={projectFilter} onChange={event => setProjectFilter(event.target.value)} className="bg-bg-base border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-muted-steel max-w-48">
                <option value="ALL">All projects</option>{projects.map(project => <option key={project.projectId} value={project.projectId}>{project.title}</option>)}
              </select>
              {[['LIST', List], ['MONTH', CalendarDays], ['WEEK', CalendarClock]].map(([value, Icon]) => <button key={value} type="button" title={value} onClick={() => setView(value)} className={`p-2 rounded-lg border ${view === value ? 'text-muted-cyan border-muted-cyan/20 bg-muted-cyan/10' : 'text-muted-steel border-transparent'}`}><Icon size={15} /></button>)}
            </div>
          </div>

          {view !== 'LIST' && !loading ? <BuildDayCalendar sessions={visibleSessions} view={view} onSelect={item => item.status === 'SCHEDULED' && setModal({ type: 'manual', session: item })} /> : <div className="space-y-3">
            {loading ? [1, 2, 3].map(item => <Skeleton key={item} className="h-28" />) : visibleSessions.length ? visibleSessions.map(session => (
              <SessionCard key={session._id} session={session} onEdit={item => setModal({ type: 'manual', session: item })} onComplete={item => runAction(() => calendarApi.complete(item._id), 'Build Day completed.')} onCancel={cancel} onRetry={item => runAction(() => calendarApi.retry(item._id), 'Calendar sync restored.')} />
            )) : (
              <Card hover={false} className="p-10 text-center">
                <CalendarCheck size={30} className="text-muted-cyan mx-auto mb-3" />
                <h3 className="text-lg font-medium text-canvas-white">No {filter.toLowerCase()} Build Days</h3>
                <p className="text-sm text-muted-steel mt-1">Schedule one manually or let GitMentor distribute your roadmap phases.</p>
              </Card>
            )}
          </div>}
        </>
      )}

      {!loading && modal?.type === 'manual' && <BuildDayModal projects={projects} session={modal.session} initialProjectId={modal.projectId} initialPhaseId={modal.phaseId} onClose={() => setModal(null)} onSubmit={data => runAction(() => modal.session ? calendarApi.update(modal.session._id, data) : calendarApi.create(data), modal.session ? 'Build Day updated.' : 'Build Day scheduled.', true)} />}
      {!loading && modal?.type === 'auto' && <AutoScheduleModal projects={projects} initialProjectId={modal.projectId} onClose={() => setModal(null)} onSubmit={items => runAction(() => calendarApi.createBatch(items), 'Roadmap Build Days scheduled.', true)} />}
    </div>
  );
};

export default BuildDays;
