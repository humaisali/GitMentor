import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import {
  Bot,
  Brain,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileJson,
  Link2,
  LoaderCircle,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/apiClient';
import { calendarApi } from '../services/calendarApi';
import { settingsApi } from '../services/settingsApi';

const SECTIONS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'mentor', label: 'AI Mentor', icon: Bot },
  { id: 'skills', label: 'Skill Engine', icon: Brain },
  { id: 'build-days', label: 'Build Days', icon: CalendarClock },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'data', label: 'Data & Privacy', icon: ShieldCheck },
];

const CAREER_TRACKS = [
  { id: 'frontend-developer', label: 'Frontend Developer' },
  { id: 'backend-developer', label: 'Backend Developer' },
  { id: 'full-stack-developer', label: 'Full-Stack Developer' },
  { id: 'ai-app-developer', label: 'AI App Developer' },
  { id: 'devops-beginner', label: 'DevOps Beginner' },
  { id: 'open-source-contributor', label: 'Open Source Contributor' },
];

const TIME_ZONES = [
  'UTC',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
];

const WEEK_DAYS = [
  { value: 0, label: 'S', title: 'Sunday' },
  { value: 1, label: 'M', title: 'Monday' },
  { value: 2, label: 'T', title: 'Tuesday' },
  { value: 3, label: 'W', title: 'Wednesday' },
  { value: 4, label: 'T', title: 'Thursday' },
  { value: 5, label: 'F', title: 'Friday' },
  { value: 6, label: 'S', title: 'Saturday' },
];

const formatDate = value => value
  ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  : 'Not available';

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="border-b border-white/[0.06] px-6 py-5 sm:px-7">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-muted-cyan/20 bg-muted-cyan/10">
        <Icon size={17} className="text-muted-cyan" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-canvas-white">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-steel">{description}</p>
      </div>
    </div>
  </div>
);

const SettingRow = ({ title, description, children, danger = false }) => (
  <div className="grid gap-4 px-6 py-5 sm:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-center">
    <div>
      <h3 className={`text-sm font-medium ${danger ? 'text-red-300' : 'text-canvas-white'}`}>{title}</h3>
      {description ? <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-steel">{description}</p> : null}
    </div>
    <div className="min-w-0 lg:justify-self-stretch">{children}</div>
  </div>
);

const SegmentedControl = ({ value, options, onChange, ariaLabel }) => (
  <div
    className="grid rounded-lg border border-white/[0.08] bg-bg-base p-1"
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    role="group"
    aria-label={ariaLabel}
  >
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`min-h-9 px-2 text-xs font-medium transition-colors ${value === option.value ? 'rounded-md bg-muted-cyan/12 text-muted-cyan shadow-sm' : 'text-muted-steel hover:text-canvas-white'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const ConfirmationDialog = ({ dialog, username, busy, onClose, onConfirm }) => {
  const [confirmation, setConfirmation] = useState('');
  if (!dialog) return null;
  const requiresName = dialog.type === 'delete-account';
  const canConfirm = !requiresName || confirmation === username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title">
      <div className="w-full max-w-md rounded-lg border border-white/[0.1] bg-bg-base p-6 shadow-elevation-4">
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${dialog.danger ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-muted-cyan/20 bg-muted-cyan/10 text-muted-cyan'}`}>
            <CircleAlert size={19} />
          </div>
          <button type="button" onClick={onClose} className="p-2 text-muted-steel hover:text-canvas-white" aria-label="Close confirmation"><X size={17} /></button>
        </div>
        <h2 id="settings-dialog-title" className="mt-5 text-lg font-semibold text-canvas-white">{dialog.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-steel">{dialog.description}</p>
        {requiresName ? (
          <label className="mt-5 flex flex-col gap-2 text-xs text-muted-steel">
            Type <span className="font-mono text-canvas-white">{username}</span> to confirm
            <input value={confirmation} onChange={event => setConfirmation(event.target.value)} className="rounded-lg border border-red-500/20 bg-white/[0.03] px-3 py-2.5 text-sm text-canvas-white outline-none focus:border-red-400" autoFocus />
          </label>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={dialog.danger ? 'ghost' : 'primary'} onClick={() => onConfirm(confirmation)} disabled={busy || !canConfirm} className={dialog.danger ? 'gap-2 border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'gap-2'}>
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : null}
            {dialog.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dialog, setDialog] = useState(null);

  const loadSettings = useCallback(async () => {
    const data = await settingsApi.get();
    setSettings(data);
    setDraft(data.preferences);
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    settingsApi.get()
      .then(data => {
        if (!active) return;
        setSettings(data);
        setDraft(data.preferences);
        if (searchParams.get('google') === 'connected') setMessage({ type: 'success', text: 'Google Calendar connected successfully.' });
        if (searchParams.get('google') === 'error') setMessage({ type: 'error', text: 'Google Calendar could not be connected. Please try again.' });
      })
      .catch(error => { if (active) setMessage({ type: 'error', text: error.message }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [searchParams]);

  const dirty = useMemo(() => Boolean(
    settings?.preferences && draft && JSON.stringify(settings.preferences) !== JSON.stringify(draft)
  ), [draft, settings]);

  const updatePreference = (section, key, value) => {
    setDraft(current => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  };

  const runAction = async (name, action, successText, { reload = true } = {}) => {
    setBusyAction(name);
    setMessage({ type: '', text: '' });
    try {
      const result = await action();
      if (reload) await loadSettings();
      setMessage({ type: 'success', text: result?.message || successText });
      return result;
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      throw error;
    } finally {
      setBusyAction('');
    }
  };

  const savePreferences = async () => {
    await runAction('save', () => settingsApi.update(draft), 'Settings saved.', { reload: false })
      .then(data => {
        setSettings(data);
        setDraft(data.preferences);
        refreshUser();
      })
      .catch(() => {});
  };

  const connectCalendar = async () => {
    setBusyAction('calendar-connect');
    try {
      const { authorizationUrl } = await calendarApi.connect('/settings');
      window.location.href = authorizationUrl;
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setBusyAction('');
    }
  };

  const verifyCalendar = () => runAction(
    'calendar-verify',
    () => calendarApi.connectionStatus(true),
    'Google Calendar connection verified.'
  ).catch(() => {});

  const refreshGitHub = () => runAction(
    'github-refresh',
    () => apiRequest('/repositories/github/refresh'),
    'GitHub repository data refreshed.'
  ).catch(() => {});

  const reassessSkills = () => runAction(
    'skill-assessment',
    () => apiRequest('/skills/assess', {
      method: 'POST',
      body: JSON.stringify({ targetRole: draft.skillEngine.targetRole }),
    }),
    'Skill assessment updated for the selected target role.'
  ).catch(() => {});

  const downloadExport = async () => {
    setBusyAction('export');
    try {
      const data = await settingsApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gitmentor-${user?.username || 'account'}-export.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'GitMentor data export downloaded.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  const confirmDialogAction = async confirmation => {
    const action = dialog?.type;
    try {
      if (action === 'disconnect-calendar') {
        await runAction('disconnect-calendar', calendarApi.disconnect, 'Google Calendar disconnected.');
        await refreshUser();
      } else if (action === 'reset-skills') {
        await runAction('reset-skills', () => apiRequest('/skills/profile', { method: 'DELETE' }), 'Skill assessment deleted.');
      } else if (action === 'logout-all') {
        await runAction('logout-all', settingsApi.logoutAll, 'All sessions signed out.', { reload: false });
        logout();
        navigate('/login', { replace: true });
      } else if (action === 'delete-account') {
        await runAction('delete-account', () => settingsApi.deleteAccount(confirmation), 'Account deleted.', { reload: false });
        logout();
        navigate('/login', { replace: true });
      }
      setDialog(null);
    } catch {
      // The action helper already surfaces the error.
    }
  };

  const toggleWorkingDay = day => {
    const days = draft.buildDays.workingDays;
    if (days.includes(day) && days.length === 1) {
      setMessage({ type: 'error', text: 'Keep at least one preferred Build Day selected.' });
      return;
    }
    updatePreference('buildDays', 'workingDays', days.includes(day)
      ? days.filter(value => value !== day)
      : [...days, day].sort((left, right) => left - right));
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-1">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Skeleton className="h-80" />
          <Skeleton className="h-[560px]" />
        </div>
      </div>
    );
  }

  if (!settings || !draft) {
    return <div className="glass-card mx-auto max-w-xl p-8 text-center text-sm text-red-300">{message.text || 'Unable to load settings.'}</div>;
  }

  const calendar = settings.integrations.googleCalendar;
  const github = settings.integrations.github;
  const assessment = settings.skillEngine;
  const allTimeZones = TIME_ZONES.includes(draft.general.timeZone) ? TIME_ZONES : [draft.general.timeZone, ...TIME_ZONES];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Settings</h1>
          <p className="mt-1 text-sm text-muted-steel">Control how GitMentor assesses, mentors, schedules, and stores your work.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-steel">
          <ShieldCheck size={15} className="text-emerald-400" />
          Changes are private to your account
        </div>
      </header>

      {message.text ? (
        <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-500/20 bg-red-500/[0.07] text-red-300' : 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300'}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ type: '', text: '' })} aria-label="Dismiss message"><X size={15} /></button>
        </div>
      ) : null}

      <div className="grid min-w-0 min-h-[650px] gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="w-full min-w-0 self-start lg:sticky lg:top-8">
          <nav className="flex w-full max-w-full gap-1 overflow-x-auto rounded-lg border border-white/[0.07] bg-white/[0.025] p-2 lg:flex-col" aria-label="Settings sections">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex min-w-max items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${activeSection === section.id ? 'border-muted-cyan/20 bg-muted-cyan/[0.08] text-muted-cyan' : 'border-transparent text-muted-steel hover:bg-white/[0.04] hover:text-canvas-white'}`}
                >
                  <Icon size={16} />
                  <span className="flex-1">{section.label}</span>
                  <ChevronRight size={14} className="hidden lg:block" />
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.025]">
            {activeSection === 'general' ? (
              <>
                <SectionHeader icon={User} title="General" description="Your identity, regional preferences, and active GitMentor session." />
                <div className="divide-y divide-white/[0.06]">
                  <SettingRow title="GitMentor identity" description="Your account identity comes from GitHub and cannot be edited inside GitMentor.">
                    <div className="flex items-center gap-3">
                      {settings.profile.avatarUrl ? <img src={settings.profile.avatarUrl} alt={settings.profile.username} className="h-11 w-11 rounded-lg border border-white/[0.1]" /> : <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.1] bg-bg-base font-mono text-sm">{settings.profile.username.slice(0, 2).toUpperCase()}</div>}
                      <div className="min-w-0"><p className="truncate text-sm font-medium text-canvas-white">{settings.profile.username}</p><p className="truncate font-mono text-[11px] text-muted-steel">GitHub ID {settings.profile.githubId}</p></div>
                    </div>
                  </SettingRow>
                  <SettingRow title="Timezone" description="Used for Build Days, reminders, and dates throughout GitMentor.">
                    <select value={draft.general.timeZone} onChange={event => updatePreference('general', 'timeZone', event.target.value)} className="w-full rounded-lg border border-white/[0.1] bg-bg-base px-3 py-2.5 text-sm text-canvas-white">{allTimeZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}</select>
                  </SettingRow>
                  <SettingRow title="Week starts on" description="Controls calendar and planning views.">
                    <SegmentedControl value={draft.general.weekStartsOn} onChange={value => updatePreference('general', 'weekStartsOn', value)} ariaLabel="First day of week" options={[{ value: 1, label: 'Monday' }, { value: 0, label: 'Sunday' }]} />
                  </SettingRow>
                  <SettingRow title="Current session" description={`Member since ${new Date(settings.profile.memberSince).toLocaleDateString()}.`}>
                    <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDialog({ type: 'logout-all', title: 'Sign out every session?', description: 'Every GitMentor token for this account will stop working, including this session.', confirmLabel: 'Sign out all', danger: false })}>Sign out all</Button><Button variant="ghost" onClick={handleLogout} className="gap-2"><LogOut size={15} /> Logout</Button></div>
                  </SettingRow>
                </div>
              </>
            ) : null}

            {activeSection === 'mentor' ? (
              <>
                <SectionHeader icon={Bot} title="AI Mentor" description="Choose how Project Mentor guides you without changing the technical quality of its answers." />
                <div className="divide-y divide-white/[0.06]">
                  <SettingRow title="Mentoring style" description="Controls whether the mentor coaches, balances, or leads with implementation."><SegmentedControl value={draft.mentor.style} onChange={value => updatePreference('mentor', 'style', value)} ariaLabel="Mentoring style" options={[{ value: 'GUIDED', label: 'Guided' }, { value: 'BALANCED', label: 'Balanced' }, { value: 'DIRECT', label: 'Direct' }]} /></SettingRow>
                  <SettingRow title="Explanation depth" description="Adjusts the amount of reasoning, context, and tradeoff discussion."><SegmentedControl value={draft.mentor.explanationDepth} onChange={value => updatePreference('mentor', 'explanationDepth', value)} ariaLabel="Explanation depth" options={[{ value: 'CONCISE', label: 'Concise' }, { value: 'STANDARD', label: 'Standard' }, { value: 'DETAILED', label: 'Detailed' }]} /></SettingRow>
                  <SettingRow title="Code guidance" description="Hints-first supports learning; complete examples prioritize speed."><SegmentedControl value={draft.mentor.codeGuidance} onChange={value => updatePreference('mentor', 'codeGuidance', value)} ariaLabel="Code guidance" options={[{ value: 'HINTS_FIRST', label: 'Hints first' }, { value: 'COMPLETE_EXAMPLES', label: 'Full examples' }]} /></SettingRow>
                  <div className="px-6 py-5 sm:px-7"><div className="flex gap-3 rounded-lg border border-muted-cyan/15 bg-muted-cyan/[0.05] p-4"><Bot size={17} className="mt-0.5 shrink-0 text-muted-cyan" /><p className="text-xs leading-relaxed text-muted-steel">These preferences are injected into Project Mentor instructions for every roadmap conversation. They do not select or expose infrastructure-level AI providers.</p></div></div>
                </div>
              </>
            ) : null}

            {activeSection === 'skills' ? (
              <>
                <SectionHeader icon={Brain} title="Skill Engine" description="Manage the career target that controls role-weighted assessment and roadmap recommendations." />
                <div className="divide-y divide-white/[0.06]">
                  <SettingRow title="Target role" description="Changing this role changes category weighting on your next assessment.">
                    <select value={draft.skillEngine.targetRole} onChange={event => updatePreference('skillEngine', 'targetRole', event.target.value)} className="w-full rounded-lg border border-white/[0.1] bg-bg-base px-3 py-2.5 text-sm text-canvas-white">{CAREER_TRACKS.map(track => <option key={track.id} value={track.id}>{track.label}</option>)}</select>
                  </SettingRow>
                  <SettingRow title="Current assessment" description={assessment ? `Assessed ${formatDate(assessment.assessedAt)} from ${assessment.repositoriesAnalyzed} repositories.` : 'No Skill Engine assessment is currently stored.'}>
                    {assessment ? <div className="flex flex-wrap items-center justify-end gap-2"><span className="text-2xl font-semibold text-canvas-white">{assessment.overallScore}</span><Badge variant="primary">{assessment.overallLevel}</Badge>{assessment.assessmentOutOfDate ? <Badge variant="warning">ROLE CHANGED</Badge> : <Badge variant="success">CURRENT</Badge>}</div> : <p className="text-right text-sm text-muted-steel">Not assessed</p>}
                  </SettingRow>
                  <SettingRow title="Assessment actions" description="Reassessment reads current GitHub and tracked-repository evidence and may take a moment.">
                    <div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => navigate('/skills')}>Open profile <ExternalLink size={14} /></Button><Button onClick={reassessSkills} disabled={busyAction === 'skill-assessment'} className="gap-2">{busyAction === 'skill-assessment' ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />} Reassess now</Button></div>
                  </SettingRow>
                  {assessment ? <SettingRow danger title="Delete assessment" description="Removes the active profile and its assessment history. GitHub and project data remain intact."><div className="flex justify-end"><Button variant="ghost" className="text-red-400" onClick={() => setDialog({ type: 'reset-skills', title: 'Delete the Skill Profile?', description: 'The current scores, evidence, recommendations, and assessment history will be removed. You can run a new assessment later.', confirmLabel: 'Delete assessment', danger: true })}>Delete assessment</Button></div></SettingRow> : null}
                </div>
              </>
            ) : null}

            {activeSection === 'build-days' ? (
              <>
                <SectionHeader icon={CalendarClock} title="Build Days" description="Set defaults used by manual scheduling and Auto-plan. You can still override them for an individual session." />
                <div className="divide-y divide-white/[0.06]">
                  <SettingRow title="Preferred start time" description={`Sessions are created in ${draft.general.timeZone}.`}><input type="time" value={draft.buildDays.startTime} onChange={event => updatePreference('buildDays', 'startTime', event.target.value)} className="w-full rounded-lg border border-white/[0.1] bg-bg-base px-3 py-2.5 text-sm text-canvas-white" /></SettingRow>
                  <SettingRow title="Default session length" description="Used to estimate Build Day start and end times."><select value={draft.buildDays.durationMinutes} onChange={event => updatePreference('buildDays', 'durationMinutes', Number(event.target.value))} className="w-full rounded-lg border border-white/[0.1] bg-bg-base px-3 py-2.5 text-sm text-canvas-white"><option value={60}>1 hour</option><option value={90}>1.5 hours</option><option value={120}>2 hours</option><option value={180}>3 hours</option></select></SettingRow>
                  <SettingRow title="Default reminder" description="Google Calendar reminder added to new Build Days."><select value={draft.buildDays.reminderMinutes} onChange={event => updatePreference('buildDays', 'reminderMinutes', Number(event.target.value))} className="w-full rounded-lg border border-white/[0.1] bg-bg-base px-3 py-2.5 text-sm text-canvas-white"><option value={10}>10 minutes before</option><option value={30}>30 minutes before</option><option value={60}>1 hour before</option><option value={1440}>1 day before</option></select></SettingRow>
                  <SettingRow title="Preferred working days" description="Auto-plan places the required Build Days only on selected weekdays.">
                    <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Preferred Build Days">{WEEK_DAYS.map(day => { const selected = draft.buildDays.workingDays.includes(day.value); return <button key={day.value} type="button" aria-pressed={selected} title={day.title} onClick={() => toggleWorkingDay(day.value)} className={`aspect-square rounded-md border text-xs font-mono transition-colors ${selected ? 'border-muted-cyan/30 bg-muted-cyan/10 text-muted-cyan' : 'border-white/[0.08] bg-bg-base text-muted-steel hover:text-canvas-white'}`}>{day.label}</button>; })}</div>
                  </SettingRow>
                </div>
              </>
            ) : null}

            {activeSection === 'integrations' ? (
              <>
                <SectionHeader icon={Link2} title="Integrations" description="Inspect connection health and refresh the services GitMentor uses for evidence and scheduling." />
                <div className="divide-y divide-white/[0.06]">
                  <div className="px-6 py-6 sm:px-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.1] bg-bg-base"><FaGithub size={22} /></div><div><div className="flex items-center gap-2"><h3 className="font-medium text-canvas-white">GitHub</h3><Badge variant={github.connected ? 'success' : 'error'}>{github.connected ? 'CONNECTED' : 'ACTION NEEDED'}</Badge></div><p className="mt-1 text-xs text-muted-steel">@{settings.profile.username} · {github.trackedRepositoryCount} tracked · {github.cachedRepositoryCount} cached</p><p className="mt-1 font-mono text-[10px] text-muted-steel">Last refreshed: {formatDate(github.lastRefreshedAt)}</p></div></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate('/repositories')}>Repositories</Button><Button onClick={refreshGitHub} disabled={busyAction === 'github-refresh'} className="gap-2">{busyAction === 'github-refresh' ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh</Button></div></div></div>
                  <div className="px-6 py-6 sm:px-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.1] bg-bg-base"><FcGoogle size={22} /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-canvas-white">Google Calendar</h3><Badge variant={calendar.status === 'CONNECTED' ? 'success' : calendar.status === 'RECONNECT_REQUIRED' ? 'warning' : 'default'}>{calendar.status.replaceAll('_', ' ')}</Badge></div><p className="mt-1 text-xs text-muted-steel">{calendar.email || 'No Google account linked'}</p><p className="mt-1 font-mono text-[10px] text-muted-steel">Last verified: {formatDate(calendar.lastValidatedAt)}</p></div></div><div className="flex flex-wrap gap-2">{calendar.connected ? <Button variant="secondary" onClick={verifyCalendar} disabled={busyAction === 'calendar-verify'} className="gap-2">{busyAction === 'calendar-verify' ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Verify</Button> : null}<Button onClick={connectCalendar} disabled={busyAction === 'calendar-connect'}>{calendar.status === 'RECONNECT_REQUIRED' ? 'Reconnect' : calendar.connected ? 'Reconnect' : 'Connect'}</Button>{calendar.status !== 'DISCONNECTED' ? <Button variant="ghost" className="text-red-400" onClick={() => setDialog({ type: 'disconnect-calendar', title: 'Disconnect Google Calendar?', description: 'GitMentor will stop syncing Build Days. Existing events remain in Google Calendar.', confirmLabel: 'Disconnect', danger: true })}>Disconnect</Button> : null}</div></div></div>
                </div>
              </>
            ) : null}

            {activeSection === 'data' ? (
              <>
                <SectionHeader icon={ShieldCheck} title="Data & Privacy" description="Review what GitMentor stores, download a portable copy, or permanently remove the account." />
                <div className="divide-y divide-white/[0.06]">
                  <div className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-4">{[['Repositories', settings.dataSummary.trackedRepositories], ['Projects', settings.dataSummary.projects], ['Build Days', settings.dataSummary.buildSessions], ['Skill Profile', settings.dataSummary.hasSkillProfile ? 'Stored' : 'None']].map(([label, value]) => <div key={label} className="bg-bg-base/70 px-5 py-4"><p className="text-[10px] font-mono uppercase text-muted-steel">{label}</p><p className="mt-1 text-lg font-semibold text-canvas-white">{value}</p></div>)}</div>
                  <SettingRow title="Download your data" description="Exports account preferences, tracked repositories, roadmaps, Build Days, analytics, and Skill Engine data as JSON."><div className="flex justify-end"><Button variant="secondary" onClick={downloadExport} disabled={busyAction === 'export'} className="gap-2">{busyAction === 'export' ? <LoaderCircle size={15} className="animate-spin" /> : <FileJson size={15} />} Download JSON</Button></div></SettingRow>
                  <div className="border-t border-red-500/15 bg-red-500/[0.025] px-6 py-4 sm:px-7"><p className="text-[11px] font-mono uppercase tracking-wider text-red-400">Danger Zone</p></div>
                  <SettingRow danger title="Delete GitMentor account" description="Permanently removes your roadmaps, sessions, repository tracking, reviews, analytics, and Skill Engine data. This cannot be undone."><div className="flex justify-end"><Button variant="ghost" className="gap-2 border border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={() => setDialog({ type: 'delete-account', title: 'Delete your GitMentor account?', description: 'This permanently deletes all GitMentor data owned by this account and revokes the stored Google Calendar token.', confirmLabel: 'Delete account', danger: true })}><Trash2 size={15} /> Delete account</Button></div></SettingRow>
                </div>
              </>
            ) : null}
          </div>

          {dirty ? (
            <div className="sticky bottom-4 z-20 mt-4 flex flex-col items-start justify-between gap-3 rounded-lg border border-muted-cyan/20 bg-bg-base/95 px-4 py-3 shadow-elevation-3 backdrop-blur-xl sm:flex-row sm:items-center">
              <div><p className="text-sm font-medium text-canvas-white">Unsaved changes</p><p className="text-xs text-muted-steel">Save to apply these preferences across GitMentor.</p></div>
              <div className="flex gap-2"><Button variant="secondary" onClick={() => setDraft(settings.preferences)} className="gap-2"><RotateCcw size={14} /> Reset</Button><Button onClick={savePreferences} disabled={busyAction === 'save'} className="gap-2">{busyAction === 'save' ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save changes</Button></div>
            </div>
          ) : null}
        </main>
      </div>

      <ConfirmationDialog key={dialog?.type || 'closed'} dialog={dialog} username={settings.profile.username} busy={Boolean(busyAction)} onClose={() => setDialog(null)} onConfirm={confirmDialogAction} />
    </div>
  );
};

export default Settings;
