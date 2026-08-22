import { useState } from 'react';
import { CalendarRange, ChevronLeft, Sparkles, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { generateBuildDayPreview, getSelectedTimeline } from '../../utils/schedulePlanner';

const tomorrowValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const TOMORROW = tomorrowValue();

export const AutoScheduleModal = ({ projects, defaults = {}, initialProjectId, onClose, onSubmit }) => {
  const eligible = projects.filter(project => project.phases?.some(phase => !phase.isCompleted) && getSelectedTimeline(project));
  const [form, setForm] = useState({
    projectId: initialProjectId && eligible.some(project => project.projectId === initialProjectId) ? initialProjectId : eligible[0]?.projectId || '',
    startDate: TOMORROW,
    startTime: defaults.startTime || '18:00',
    duration: String(defaults.durationMinutes || 120),
    reminder: String(defaults.reminderMinutes || 30),
  });
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const project = eligible.find(item => item.projectId === form.projectId);
  const selectedTimeline = getSelectedTimeline(project);
  const preview = generateBuildDayPreview({
    ...form,
    project,
    timeZone: defaults.timeZone,
    workingDays: defaults.workingDays,
  });
  const previewStart = preview[0] ? new Date(preview[0].startAt) : null;
  const previewEnd = preview.at(-1) ? new Date(preview.at(-1).startAt) : null;

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
            <p className="text-sm text-muted-steel mt-1">Fit focused Build Days inside the project’s confirmed timeline.</p>
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
            {selectedTimeline && (
              <div className="rounded-xl border border-muted-cyan/20 bg-muted-cyan/[0.06] p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-cyan">Confirmed timeline · {selectedTimeline.duration}</p>
                <p className="text-sm text-canvas-white mt-1">{preview.length} Build Days from {previewStart?.toLocaleDateString()} to {previewEnd?.toLocaleDateString()}</p>
                <p className="text-xs text-muted-steel mt-1">One Build Day is created for every calendar day; phases are distributed across the confirmed window.</p>
              </div>
            )}
            <div className="space-y-3">
              {preview.map((session, index) => (
                <div key={session.previewId} className="glass-surface p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-cyan">BUILD DAY {index + 1}</span>
                      <Badge variant="outline" className="text-[10px]">PHASE {session.phaseNumber} OF {session.phaseCount}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-cyan mt-2">Roadmap phase · {session.phaseTitle}</p>
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
              <Button onClick={confirm} disabled={saving || !preview.length}>{saving ? 'Syncing roadmap...' : `Confirm ${preview.length} Build Days`}</Button>
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

            {selectedTimeline && (
              <div className="rounded-xl border border-muted-cyan/20 bg-muted-cyan/[0.06] px-4 py-3 text-sm">
                <span className="text-muted-cyan font-medium">Confirmed project timeline: {selectedTimeline.duration}</span>
                <span className="text-muted-steel"> · This creates exactly {selectedTimeline.durationDays} Build Days.</span>
              </div>
            )}

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

            <label className="flex flex-col gap-1.5 text-sm text-canvas-white max-w-xs">
              Reminder
              <select value={form.reminder} onChange={event => setForm(current => ({ ...current, reminder: event.target.value }))} className="bg-bg-base border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm">
                <option value="10">10 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option>
              </select>
            </label>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={() => setReviewing(true)}>Preview Schedule</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
