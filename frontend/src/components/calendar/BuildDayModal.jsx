import { useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const toLocalInput = (value) => {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const defaultEnd = (startValue) => {
  const date = new Date(startValue || Date.now() + 60 * 60 * 1000);
  date.setHours(date.getHours() + 2);
  return toLocalInput(date);
};

export const BuildDayModal = ({ projects, initialProjectId, initialPhaseId, session, onClose, onSubmit }) => {
  const [form, setForm] = useState(() => ({
    projectId: session?.project?.projectId || session?.projectId || initialProjectId || projects[0]?.projectId || '',
    phaseId: session?.phaseId || initialPhaseId || '',
    taskIds: session?.taskIds || [],
    title: session?.title || '',
    objective: session?.objective || '',
    milestone: session?.milestone || '',
    notes: session?.notes || '',
    startAt: toLocalInput(session?.startAt),
    endAt: session?.endAt ? toLocalInput(session.endAt) : defaultEnd(),
    reminder: String(session?.reminderMinutes?.[0] ?? 30),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const project = projects.find(item => item.projectId === form.projectId);
  const phase = project?.phases?.find(item => item.phaseId === form.phaseId);

  const tasks = phase?.tasks || [];

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.projectId) return setError('Choose a roadmap project.');
    if (new Date(form.endAt) <= new Date(form.startAt)) return setError('End time must be after start time.');

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        phaseId: form.phaseId || undefined,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        reminderMinutes: [Number(form.reminder)],
      });
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <Card hover={false} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 shadow-elevation-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-canvas-white flex items-center gap-2">
              <CalendarClock size={20} className="text-muted-cyan" /> {session ? 'Edit Build Day' : 'Schedule Build Day'}
            </h2>
            <p className="text-sm text-muted-steel mt-1">Tie focused calendar time to a roadmap milestone.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-steel hover:text-canvas-white hover:bg-white/[0.06]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-canvas-white">
              Project
              <select value={form.projectId} disabled={Boolean(session)} onChange={event => update('projectId', event.target.value)} className="bg-bg-base border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm">
                <option value="">Choose project</option>
                {projects.map(item => <option key={item.projectId} value={item.projectId}>{item.title}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-canvas-white">
              Phase (optional)
              <select value={form.phaseId} onChange={event => setForm(current => ({ ...current, phaseId: event.target.value, taskIds: [] }))} className="bg-bg-base border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm">
                <option value="">General project session</option>
                {(project?.phases || []).map(item => <option key={item.phaseId} value={item.phaseId}>{item.title}</option>)}
              </select>
            </label>
          </div>

          <Input label="Calendar title" placeholder={project ? `GitMentor Build Day: ${project.title}` : 'Build Day title'} value={form.title} onChange={event => update('title', event.target.value)} />
          <Input label="Learning objective" placeholder="What will you learn or deliver?" value={form.objective} onChange={event => update('objective', event.target.value)} />
          <Input label="Milestone" placeholder={phase?.title || 'The outcome that marks this session complete'} value={form.milestone} onChange={event => update('milestone', event.target.value)} />

          {tasks.length > 0 && (
            <fieldset className="glass-surface p-4">
              <legend className="px-2 text-xs font-mono uppercase tracking-wider text-muted-steel">Tasks for this session</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {tasks.map(task => (
                  <label key={task.taskId} className="flex items-start gap-2 text-sm text-canvas-white/80 p-2 rounded-lg hover:bg-white/[0.04]">
                    <input type="checkbox" checked={form.taskIds.includes(task.taskId)} onChange={() => update('taskIds', form.taskIds.includes(task.taskId) ? form.taskIds.filter(id => id !== task.taskId) : [...form.taskIds, task.taskId])} className="mt-1 accent-blue-400" />
                    {task.title}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Starts" type="datetime-local" required value={form.startAt} onChange={event => update('startAt', event.target.value)} />
            <Input label="Ends" type="datetime-local" required value={form.endAt} onChange={event => update('endAt', event.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-canvas-white">
              Reminder
              <select value={form.reminder} onChange={event => update('reminder', event.target.value)} className="bg-bg-base border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm">
                <option value="10">10 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </label>
            <Input label="Notes" placeholder="Optional preparation notes" value={form.notes} onChange={event => update('notes', event.target.value)} />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Syncing...' : session ? 'Save Changes' : 'Add to Google Calendar'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
