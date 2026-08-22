import { useState } from 'react';
import { CalendarRange, ChevronLeft, Sparkles, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { generateBuildDayPreview } from '../../utils/schedulePlanner';

const WEEKDAYS = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const tomorrowValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const TOMORROW = tomorrowValue();

export const AutoScheduleModal = ({ projects, initialProjectId, onClose, onSubmit }) => {
  const eligible = projects.filter(project => project.phases?.length);
  const [form, setForm] = useState({
    projectId: initialProjectId && eligible.some(project => project.projectId === initialProjectId) ? initialProjectId : eligible[0]?.projectId || '',
    startDate: TOMORROW,
    startTime: '18:00',
    duration: '120',
    weekdays: [1, 3, 5],
    reminder: '30',
  });
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const project = eligible.find(item => item.projectId === form.projectId);
  const preview = generateBuildDayPreview({ ...form, project });

  const toggleWeekday = (day) => setForm(current => ({
    ...current,
    weekdays: current.weekdays.includes(day) ? current.weekdays.filter(value => value !== day) : [...current.weekdays, day],
  }));

  const confirm = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit(preview);
      onClose();
    } catch (submitError) {
      setError({
        message: submitError.message,
        code: submitError.data?.code,
        actionUrl: submitError.data?.actionUrl,
        failedSession: submitError.data?.failedSession,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <Card hover={false} className="w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 shadow-elevation-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-canvas-white flex items-center gap-2">
              <CalendarRange size={20} className="text-muted-cyan" /> Auto-plan Roadmap
            </h2>
            <p className="text-sm text-muted-steel mt-1">Split each phase into focused Build Days using its estimated effort and tasks.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-steel hover:text-canvas-white hover:bg-white/[0.06]" aria-label="Close"><X size={18} /></button>
        </div>

        {!eligible.length ? (
          <div className="text-center py-12">
            <Sparkles size={28} className="text-muted-cyan mx-auto mb-3" />
            <p className="text-canvas-white font-medium">No project phases are ready yet.</p>
            <p className="text-sm text-muted-steel mt-1">Choose a project timeline first, then return to auto-plan it.</p>
          </div>
        ) : reviewing ? (
          <div className="space-y-5">
            <button onClick={() => setReviewing(false)} className="text-sm text-muted-steel hover:text-canvas-white flex items-center gap-2"><ChevronLeft size={15} /> Edit preferences</button>
            <div className="space-y-3">
              {preview.map((session, index) => (
                <div key={session.previewId} className="glass-surface p-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-muted-cyan">BUILD DAY {index + 1}</span>
                    <h3 className="text-sm font-medium text-canvas-white mt-1">{session.title.replace('GitMentor Build Day: ', '')}</h3>
                    <p className="text-xs text-muted-steel mt-1 line-clamp-2">{session.objective}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-canvas-white">{new Date(session.startAt).toLocaleDateString()}</p>
                    <p className="text-xs font-mono text-muted-steel mt-1">{new Date(session.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="font-medium">{error.message}</p>
                {error.failedSession?.title && <p className="text-xs text-red-300/80 mt-2">Failed at: {error.failedSession.title}</p>}
                {error.actionUrl && <a className="inline-flex mt-3 text-xs font-medium text-muted-cyan hover:underline" href={error.actionUrl} target="_blank" rel="noreferrer">Open Google Cloud API settings</a>}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={confirm} disabled={saving}>{saving ? 'Syncing roadmap...' : `Confirm ${preview.length} Build Days`}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <label className="flex flex-col gap-1.5 text-sm text-canvas-white">
              Roadmap project
              <select value={form.projectId} onChange={event => setForm(current => ({ ...current, projectId: event.target.value }))} className="bg-bg-base border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm">
                {eligible.map(item => <option key={item.projectId} value={item.projectId}>{item.title}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Start date" type="date" min={TOMORROW} value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} />
              <Input label="Preferred time" type="time" value={form.startTime} onChange={event => setForm(current => ({ ...current, startTime: event.target.value }))} />
              <label className="flex flex-col gap-1.5 text-sm text-canvas-white">
                Session length
                <select value={form.duration} onChange={event => setForm(current => ({ ...current, duration: event.target.value }))} className="bg-bg-base border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm">
                  <option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option>
                </select>
              </label>
            </div>

            <div>
              <p className="text-sm text-canvas-white mb-3">Preferred coding days</p>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {WEEKDAYS.map(day => (
                  <button key={day.value} type="button" onClick={() => toggleWeekday(day.value)} className={`py-2 rounded-xl text-xs font-mono border transition-all ${form.weekdays.includes(day.value) ? 'bg-muted-cyan/10 border-muted-cyan/30 text-muted-cyan' : 'bg-white/[0.03] border-white/[0.08] text-muted-steel'}`}>{day.label}</button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-sm text-canvas-white max-w-xs">
              Reminder
              <select value={form.reminder} onChange={event => setForm(current => ({ ...current, reminder: event.target.value }))} className="bg-bg-base border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm">
                <option value="10">10 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option>
              </select>
            </label>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={() => form.weekdays.length && setReviewing(true)} disabled={!form.weekdays.length}>Preview Schedule</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
