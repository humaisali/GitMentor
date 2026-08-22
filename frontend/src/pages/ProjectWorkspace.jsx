import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft, CheckCircle2, Circle, Check, X, ListTodo, Bot, BookOpen, ExternalLink, Play, CalendarPlus, ChevronDown } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import ProjectChatAssistant from '../components/ProjectChatAssistant';

const API_BASE = 'http://localhost:5000/api/roadmaps';

const ProjectWorkspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State to track loading for specific phases/tasks
  const [startingPhase, setStartingPhase] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [completingPhase, setCompletingPhase] = useState(null);
  
  const [taskModal, setTaskModal] = useState({ isOpen: false, task: null });
  const [workspaceMessage, setWorkspaceMessage] = useState('');
  const [openCompletedPhases, setOpenCompletedPhases] = useState({});

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    let active = true;
    const requestHeaders = { Authorization: `Bearer ${localStorage.getItem('gitmentor_token')}` };
    fetch(API_BASE, { headers: requestHeaders })
      .then(async res => {
        if (!res.ok) throw new Error('Unable to load project.');
        const roadmaps = await res.json();
        if (active) setProject(roadmaps.find(item => item.projectId === projectId) || null);
      })
      .catch(err => console.error('Error fetching project:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

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

  const handleStartPhase = async (phaseId) => {
    setStartingPhase(phaseId);
    setWorkspaceMessage('');
    try {
      const res = await fetch(`${API_BASE}/${projectId}/phases/${phaseId}/start`, {
        method: 'POST',
        headers
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || responseData.message || 'Unable to start this phase.');
      setProject(responseData);
      if (responseData.taskGeneration === 'FALLBACK') {
        setWorkspaceMessage('The AI task generator was unavailable, so GitMentor created a reliable starter task plan instead.');
      }
    } catch (err) {
      setWorkspaceMessage(err.message);
    } finally {
      setStartingPhase(null);
    }
  };

  const handleCompleteTask = async (phaseId, taskId) => {
    setCompletingTask(taskId);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/phases/${phaseId}/tasks/${taskId}/complete`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingTask(null);
    }
  };

  const handleCompletePhase = async (phaseId) => {
    setCompletingPhase(phaseId);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/phases/${phaseId}/complete`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingPhase(null);
    }
  };

  const toggleCompletedPhase = (phaseId) => {
    setOpenCompletedPhases(current => ({
      ...current,
      [phaseId]: !current[phaseId],
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-muted-cyan/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-0 border-4 border-muted-cyan border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
          <Bot size={36} className="text-muted-cyan absolute" />
        </div>
        <h2 className="text-2xl font-semibold text-canvas-white mb-3">Loading Workspace</h2>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold text-canvas-white mb-2">Project Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/roadmap')}>Back to Roadmap</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 pb-10">
      {workspaceMessage && <div className="glass-surface border border-amber-500/20 px-4 py-3 text-sm text-amber-300">{workspaceMessage}</div>}
      <header className="mb-2 shrink-0">
        <button 
          onClick={() => navigate(`/roadmaps/${projectId}`)}
          className="flex items-center gap-2 text-sm text-muted-steel hover:text-canvas-white mb-6 transition-all duration-300"
        >
          <ArrowLeft size={16} /> Back to Project Hub
        </button>

        <div className="flex flex-col gap-6 animate-fade-in-up">
          {/* Project Header */}
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-muted-cyan/[0.04] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 animate-blob"></div>
            <Badge variant="primary" className="bg-muted-cyan/10 text-muted-cyan border-none mb-4">EXECUTION WORKSPACE</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-canvas-white mb-3">{project.title}</h1>
            <p className="text-[15px] text-muted-steel leading-relaxed max-w-4xl">{project.description}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-min">
        {/* Learning Materials Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-5 self-start sticky top-4">
          {project.learningMaterials && project.learningMaterials.length > 0 && (
            <div className="glass-card p-7 relative overflow-hidden animate-fade-in-up stagger-1">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-muted-cyan/[0.04] rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
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
                    className="group flex items-start gap-3 p-3 -mx-1 rounded-xl transition-all duration-300 hover:bg-white/[0.04]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-canvas-white/90 leading-snug mb-1.5 group-hover:text-muted-cyan transition-colors line-clamp-2">
                        {material.title}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-white/[0.04] border border-white/[0.06] text-muted-steel">
                        {material.source}
                      </span>
                    </div>
                    <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-white/[0.04] border border-transparent group-hover:border-muted-cyan/30 group-hover:bg-muted-cyan/10 group-hover:shadow-[0_0_10px_rgba(88,166,255,0.1)] transition-all duration-300">
                      <ExternalLink size={14} className="text-muted-steel group-hover:text-muted-cyan transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Execution Phases List */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {project.phases && project.phases.map((phase, idx) => {
            const isCompleted = phase.isCompleted;
            const previousPhasesCompleted = project.phases.slice(0, idx).every(p => p.isCompleted);
            const isUnlocked = previousPhasesCompleted || isCompleted;
            const isStarting = startingPhase === phase.phaseId;
            const showPhaseDetails = !isCompleted || openCompletedPhases[phase.phaseId];

            return (
              <div key={phase.phaseId} className={`relative flex flex-col p-7 glass-card transition-all duration-300 animate-fade-in-up stagger-${Math.min((idx % 6) + 1, 6)}
                ${isCompleted 
                  ? 'opacity-70' 
                  : isUnlocked 
                    ? 'border-muted-cyan/15 shadow-[0_0_20px_rgba(88,166,255,0.06)]' 
                    : 'opacity-40 grayscale'}`}>
                
                <div className="flex gap-5 mb-2">
                  <div className="shrink-0 relative z-10 pt-1">
                    {isCompleted ? (
                      <div className="w-11 h-11 rounded-full bg-muted-cyan/15 flex items-center justify-center border border-muted-cyan/30 shadow-[0_0_15px_rgba(88,166,255,0.15)]">
                        <CheckCircle2 size={22} className="text-muted-cyan" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300
                        ${isUnlocked ? 'bg-white/[0.03] border-muted-cyan/30 text-muted-cyan shadow-[0_0_10px_rgba(88,166,255,0.1)]' : 'bg-white/[0.02] border-white/[0.08] text-muted-steel'}`}>
                        <Circle size={22} className={isUnlocked ? 'fill-muted-cyan/10' : ''} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <h4 className={`text-xl font-medium pr-4 ${isCompleted ? 'text-muted-steel line-through' : 'text-canvas-white'}`}>
                        {phase.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {isUnlocked && !isCompleted && (
                          <button onClick={() => navigate(`/build-days?projectId=${encodeURIComponent(projectId)}&phaseId=${encodeURIComponent(phase.phaseId)}`)} className="p-1.5 rounded-lg text-muted-steel hover:text-muted-cyan hover:bg-muted-cyan/10" title="Schedule this phase">
                            <CalendarPlus size={15} />
                          </button>
                        )}
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.06] text-muted-steel">
                          {phase.estimatedTime}
                        </span>
                      </div>
                    </div>
                    {showPhaseDetails && (
                      <p className="text-[15px] text-muted-steel leading-relaxed">{phase.description}</p>
                    )}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => toggleCompletedPhase(phase.phaseId)}
                        aria-expanded={Boolean(openCompletedPhases[phase.phaseId])}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-cyan transition-colors hover:text-canvas-white"
                      >
                        More
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openCompletedPhases[phase.phaseId] ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Tasks / Action Area */}
                {isUnlocked && showPhaseDetails && (
                  <div className="ml-16 mt-4">
                    {/* State 1: Not Started */}
                    {!phase.isStarted && !isStarting && !isCompleted && (
                      <Button 
                        variant="primary" 
                        className="text-sm px-6 py-3 h-auto gap-2"
                        onClick={() => handleStartPhase(phase.phaseId)}
                      >
                        <Play size={16} /> Start this Phase
                      </Button>
                    )}

                    {/* State 2: Starting (Generating) */}
                    {isStarting && (
                      <div className="glass-surface p-6 flex flex-col items-center justify-center text-center">
                         <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
                          <div className="absolute inset-0 border-2 border-muted-cyan/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
                          <div className="absolute inset-0 border-2 border-muted-cyan border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                          <Sparkles size={16} className="text-muted-cyan absolute" />
                        </div>
                        <h4 className="text-sm font-medium text-canvas-white mb-1">AI is Generating Tasks</h4>
                        <p className="text-xs text-muted-steel max-w-[280px]">
                          Gemini is analyzing the phase and creating a step-by-step implementation guide...
                        </p>
                      </div>
                    )}

                    {/* State 3: Started (Tasks rendered inline) */}
                    {phase.isStarted && phase.tasks && phase.tasks.length > 0 && (
                      <div className="mt-4 border-t border-white/[0.06] pt-6">
                        <h4 className="text-sm font-semibold text-canvas-white uppercase tracking-wider mb-4 flex items-center gap-2">
                           <ListTodo size={16} className="text-muted-cyan" /> Actionable Tasks
                        </h4>
                        
                        <div className="space-y-3">
                          {phase.tasks.map((task) => (
                            <div key={task.taskId} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-300 backdrop-blur-sm ${task.isCompleted ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03]'}`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <p className={`text-[14px] leading-snug ${task.isCompleted ? 'text-muted-steel line-through' : 'text-canvas-white/90'}`}>
                                  {task.title}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                <Button
                                  variant="secondary"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => setTaskModal({ isOpen: true, task })}
                                >
                                  Details
                                </Button>
                                <Button
                                  variant="primary"
                                  className={`h-8 px-4 text-xs gap-1.5 min-w-[85px] ${task.isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}`}
                                  disabled={task.isCompleted || completingTask === task.taskId}
                                  onClick={() => handleCompleteTask(phase.phaseId, task.taskId)}
                                >
                                  {completingTask === task.taskId ? <Sparkles size={14} className="animate-pulse" /> : <Check size={14} />}
                                  {task.isCompleted ? 'Done' : 'Done'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {phase.tasks.every(t => t.isCompleted) && !isCompleted && (
                          <div className="mt-6 flex justify-end">
                            <Button 
                              variant="primary" 
                              className="gap-2 px-6"
                              onClick={() => handleCompletePhase(phase.phaseId)}
                              disabled={completingPhase === phase.phaseId}
                            >
                              {completingPhase === phase.phaseId ? <Sparkles size={16} className="animate-pulse" /> : <CheckCircle2 size={16} />}
                              {completingPhase === phase.phaseId ? 'Completing...' : 'Complete Phase'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Modal */}
      {taskModal.isOpen && taskModal.task && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setTaskModal({ isOpen: false, task: null })}></div>
          <Card hover={false} className="relative w-full max-w-2xl max-h-[85vh] shadow-elevation-4 flex flex-col overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/[0.06] shrink-0">
              <div className="pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary" className="bg-muted-cyan/10 text-muted-cyan border-none">TASK DETAILS</Badge>
                  {taskModal.task.isCompleted && <Badge variant="success">COMPLETED</Badge>}
                </div>
                <h3 className="text-lg font-semibold text-canvas-white leading-snug">{taskModal.task.title}</h3>
              </div>
              <button 
                onClick={() => setTaskModal({ isOpen: false, task: null })}
                className="absolute top-6 right-6 p-2 rounded-xl text-muted-steel hover:text-canvas-white hover:bg-white/[0.06] transition-all duration-300"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono text-muted-steel uppercase tracking-wider mb-3">Context & Goal</h4>
                  <p className="text-sm text-canvas-white/80 leading-relaxed glass-surface p-4">
                    {taskModal.task.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-mono text-muted-steel uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ListTodo size={14} className="text-muted-cyan" /> Execution Steps
                  </h4>
                  <div className="space-y-3">
                    {taskModal.task.steps && taskModal.task.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-4 p-4 glass-surface relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-cyan/20 group-hover:bg-muted-cyan/50 group-hover:shadow-[0_0_8px_rgba(88,166,255,0.2)] transition-all duration-300"></div>
                        <div className="flex flex-col gap-1 w-full pl-2">
                          <p className="text-sm text-canvas-white/90 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-white/[0.06] shrink-0 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setTaskModal({ isOpen: false, task: null })}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {project?.detailedPlan && <ProjectChatAssistant projectId={projectId} />}
    </div>
  );
};

export default ProjectWorkspace;
