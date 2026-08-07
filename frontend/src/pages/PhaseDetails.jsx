import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft, CheckCircle2, Circle, Check, Info, X, ListTodo, Bot, BookOpen, ExternalLink } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import ProjectChatAssistant from '../components/ProjectChatAssistant';

const API_BASE = 'http://localhost:5000/api/roadmaps';

const PhaseDetails = () => {
  const { projectId, phaseId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [phase, setPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingPhase, setStartingPhase] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [completingPhase, setCompletingPhase] = useState(false);
  const [taskModal, setTaskModal] = useState({ isOpen: false, task: null });

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProjectAndPhase();
  }, [projectId, phaseId]);

  useEffect(() => {
    if (taskModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [taskModal.isOpen]);

  const fetchProjectAndPhase = async () => {
    try {
      const res = await fetch(API_BASE, { headers });
      if (res.ok) {
        const roadmaps = await res.json();
        const foundProject = roadmaps.find(p => p.projectId === projectId);
        if (foundProject) {
          setProject(foundProject);
          const foundPhase = foundProject.phases.find(p => p.phaseId === phaseId);
          setPhase(foundPhase);
          
          // Auto-start phase if it hasn't been started
          if (foundPhase && !foundPhase.isStarted) {
            handleStartPhase();
          } else {
            setLoading(false);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setLoading(false);
    }
  };

  const handleStartPhase = async () => {
    setStartingPhase(true);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/phases/${phaseId}/start`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        setPhase(updatedProject.phases.find(p => p.phaseId === phaseId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStartingPhase(false);
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompletingTask(taskId);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/phases/${phaseId}/tasks/${taskId}/complete`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        setPhase(updatedProject.phases.find(p => p.phaseId === phaseId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingTask(null);
    }
  };

  const handleCompletePhase = async () => {
    setCompletingPhase(true);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/phases/${phaseId}/complete`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        navigate(`/roadmaps/${projectId}`);
      }
    } catch (err) {
      console.error(err);
      setCompletingPhase(false);
    }
  };

  if (loading || startingPhase) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-muted-cyan/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-0 border-4 border-muted-cyan border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
          <Bot size={36} className="text-muted-cyan absolute" />
        </div>
        <h2 className="text-2xl font-semibold text-canvas-white mb-3">AI is Generating Your Tasks</h2>
        <p className="text-muted-steel max-w-md mx-auto leading-relaxed">
          Gemini is analyzing the phase <span className="text-muted-cyan">"{phase?.title || 'details'}"</span> and breaking it down into a highly actionable step-by-step developer guide.
        </p>
      </div>
    );
  }

  if (!project || !phase) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold text-canvas-white mb-2">Phase Not Found</h2>
        <Button variant="outline" onClick={() => navigate(`/roadmaps/${projectId}`)}>Back to Project</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto h-full p-4 overflow-auto pb-10">
      <header className="mb-2 shrink-0">
        <button 
          onClick={() => navigate(`/roadmaps/${projectId}`)}
          className="flex items-center gap-2 text-sm text-muted-steel hover:text-canvas-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Project
        </button>

        <div className="flex flex-col gap-6">
          {/* Project Header */}
          <div className="bg-charcoal-base border border-whisper/20 rounded-2xl p-6 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-canvas-white mb-2">{project.title}</h1>
            <p className="text-sm text-muted-steel leading-relaxed">{project.description}</p>
          </div>

          {/* Phase Header */}
          <div className="bg-muted-surface rounded-2xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-muted-cyan/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <Badge variant="primary" className="bg-muted-cyan/10 text-muted-cyan border-none mb-4">PHASE EXECUTION</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-canvas-white mb-4">{phase.title}</h2>
            <p className="text-[15px] text-muted-steel leading-relaxed">{phase.description}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-min">
        {/* Learning Materials Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-5 self-start">
          {project.learningMaterials && project.learningMaterials.length > 0 && (
            <div className="bg-muted-surface rounded-2xl p-7 shadow-lg relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-muted-cyan/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
              <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-5 uppercase flex items-center gap-2">
                <BookOpen size={14} className="text-muted-cyan" /> Learning Materials
              </h4>
              <div className="space-y-1 relative z-10">
                {project.learningMaterials.map((material, idx) => (
                  <a
                    key={idx}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3 -mx-1 rounded-xl transition-all duration-200 hover:bg-white/[0.04]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-canvas-white/90 leading-snug mb-1.5 group-hover:text-muted-cyan transition-colors line-clamp-2">
                        {material.title}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-white/[0.06] border border-whisper/30 text-muted-steel">
                        {material.source}
                      </span>
                    </div>
                    <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-white/[0.04] border border-transparent group-hover:border-muted-cyan/30 group-hover:bg-muted-cyan/10 transition-all">
                      <ExternalLink size={14} className="text-muted-steel group-hover:text-muted-cyan transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actionable Tasks */}
        <div className="md:col-span-8 bg-muted-surface rounded-2xl p-8 shadow-lg flex-1">
          <h3 className="text-xl font-medium text-canvas-white mb-8 flex items-center gap-2">
            <ListTodo size={20} className="text-muted-cyan" /> Actionable Tasks
          </h3>

        <div className="space-y-4 mb-8">
          {phase.tasks && phase.tasks.map((task) => (
            <div key={task.taskId} className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${task.isCompleted ? 'bg-success/5 border-success/20' : 'bg-charcoal-base border-whisper/50'}`}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <p className={`text-[15px] truncate ${task.isCompleted ? 'text-muted-steel line-through' : 'text-canvas-white/90 font-medium'}`}>
                  {task.title}
                </p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  className="h-8 px-4 text-xs border-whisper/50 text-muted-steel hover:text-canvas-white hover:border-muted-steel"
                  onClick={() => setTaskModal({ isOpen: true, task })}
                >
                  Details
                </Button>
                <Button
                  variant="primary"
                  className="h-8 px-4 text-xs gap-1.5 min-w-[90px]"
                  disabled={task.isCompleted || completingTask === task.taskId}
                  onClick={() => handleCompleteTask(task.taskId)}
                >
                  {completingTask === task.taskId ? <Sparkles size={14} className="animate-pulse" /> : <Check size={14} />}
                  {task.isCompleted ? 'Done' : 'Done'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {phase.tasks && phase.tasks.every(t => t.isCompleted) && (
          <div className="pt-6 border-t border-whisper/30 flex justify-end">
            <Button 
              variant="primary" 
              className="gap-2 px-6"
              onClick={handleCompletePhase}
              disabled={completingPhase}
            >
              {completingPhase ? <Sparkles size={16} className="animate-pulse" /> : <CheckCircle2 size={16} />}
              {completingPhase ? 'Completing...' : 'Complete Phase & Continue'}
            </Button>
          </div>
        )}
        </div>
      </div>

      {/* Task Details Modal */}
      {taskModal.isOpen && taskModal.task && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-muted-surface border border-whisper rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-whisper/40 bg-charcoal-base">
              <h3 className="text-lg font-medium text-canvas-white flex items-center gap-3">
                <ListTodo size={20} className="text-muted-cyan" /> {taskModal.task.title}
              </h3>
              <button 
                onClick={() => setTaskModal({ isOpen: false, task: null })}
                className="text-muted-steel hover:text-canvas-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-4 uppercase">Step-by-Step Guide</h4>
              {taskModal.task.steps && taskModal.task.steps.length > 0 ? (
                <ul className="space-y-4">
                  {taskModal.task.steps.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted-cyan/10 border border-muted-cyan/20 text-muted-cyan text-xs font-mono mt-0.5">{i + 1}</span>
                      <p className="text-canvas-white/85 text-[15px] leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="prose prose-invert max-w-none text-canvas-white/80 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {taskModal.task.description}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-whisper/40 bg-charcoal-base/50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTaskModal({ isOpen: false, task: null })}>Close</Button>
            </div>
          </div>
        </div>
      )}
      <ProjectChatAssistant projectId={projectId} />
    </div>
  );
};

export default PhaseDetails;
