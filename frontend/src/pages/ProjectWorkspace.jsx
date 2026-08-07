import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft, CheckCircle2, Circle, Check, Info, X, ListTodo, Bot, BookOpen, ExternalLink, Play } from 'lucide-react';
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

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProject();
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

  const fetchProject = async () => {
    try {
      const res = await fetch(API_BASE, { headers });
      if (res.ok) {
        const roadmaps = await res.json();
        const foundProject = roadmaps.find(p => p.projectId === projectId);
        if (foundProject) {
          setProject(foundProject);
        }
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPhase = async (phaseId) => {
    setStartingPhase(phaseId);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/phases/${phaseId}/start`, {
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
        <Button variant="outline" onClick={() => navigate('/roadmap')}>Back to Roadmap</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-full p-4 overflow-auto pb-10 custom-scrollbar">
      <header className="mb-2 shrink-0">
        <button 
          onClick={() => navigate(`/roadmaps/${projectId}`)}
          className="flex items-center gap-2 text-sm text-muted-steel hover:text-canvas-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Project Hub
        </button>

        <div className="flex flex-col gap-6">
          {/* Project Header */}
          <div className="bg-muted-surface rounded-2xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-muted-cyan/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-white/[0.06] border border-white/5 text-muted-steel">
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

        {/* Execution Phases List */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {project.phases && project.phases.map((phase, idx) => {
            const isCompleted = phase.isCompleted;
            const previousPhasesCompleted = project.phases.slice(0, idx).every(p => p.isCompleted);
            const isUnlocked = previousPhasesCompleted || isCompleted;
            const isStarting = startingPhase === phase.phaseId;

            return (
              <div key={phase.phaseId} className={`relative flex flex-col p-7 rounded-2xl border transition-all 
                ${isCompleted 
                  ? 'bg-muted-surface/50 border-transparent' 
                  : isUnlocked 
                    ? 'bg-muted-surface shadow-lg border-muted-cyan/10' 
                    : 'bg-charcoal-base/30 border-transparent opacity-60 grayscale'}`}>
                
                <div className="flex gap-5 mb-2">
                  <div className="shrink-0 relative z-10 pt-1">
                    {isCompleted ? (
                      <div className="w-11 h-11 rounded-full bg-muted-cyan/20 flex items-center justify-center border border-muted-cyan/30">
                        <CheckCircle2 size={22} className="text-muted-cyan" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors
                        ${isUnlocked ? 'bg-charcoal-base border-muted-cyan text-muted-cyan' : 'bg-charcoal-base border-whisper text-muted-steel'}`}>
                        <Circle size={22} className={isUnlocked ? 'fill-muted-cyan/10' : ''} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <h4 className={`text-xl font-medium pr-4 ${isCompleted ? 'text-muted-steel line-through' : 'text-canvas-white'}`}>
                        {phase.title}
                      </h4>
                      <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-charcoal-base border border-white/5 text-muted-steel">
                        {phase.estimatedTime}
                      </span>
                    </div>
                    <p className="text-[15px] text-muted-steel leading-relaxed">{phase.description}</p>
                  </div>
                </div>

                {/* Inline Tasks / Action Area */}
                {isUnlocked && (
                  <div className="ml-16 mt-4">
                    {/* State 1: Not Started */}
                    {!phase.isStarted && !isStarting && !isCompleted && (
                      <Button 
                        variant="primary" 
                        className="text-sm px-6 py-3 h-auto rounded-xl shadow-md gap-2"
                        onClick={() => handleStartPhase(phase.phaseId)}
                      >
                        <Play size={16} /> Start this Phase
                      </Button>
                    )}

                    {/* State 2: Starting (Generating) */}
                    {isStarting && (
                      <div className="bg-charcoal-base border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
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
                      <div className="mt-4 border-t border-whisper/30 pt-6">
                        <h4 className="text-sm font-semibold text-canvas-white uppercase tracking-wider mb-4 flex items-center gap-2">
                           <ListTodo size={16} className="text-muted-cyan" /> Actionable Tasks
                        </h4>
                        
                        <div className="space-y-3">
                          {phase.tasks.map((task) => (
                            <div key={task.taskId} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${task.isCompleted ? 'bg-success/5 border-success/10' : 'bg-charcoal-base border-white/5 hover:border-white/10'}`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <p className={`text-[14px] leading-snug ${task.isCompleted ? 'text-muted-steel line-through' : 'text-canvas-white/90'}`}>
                                  {task.title}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                <Button
                                  variant="outline"
                                  className="h-8 px-3 text-xs border-white/10 text-muted-steel hover:text-canvas-white hover:border-muted-steel"
                                  onClick={() => setTaskModal({ isOpen: true, task })}
                                >
                                  Details
                                </Button>
                                <Button
                                  variant="primary"
                                  className={`h-8 px-4 text-xs gap-1.5 min-w-[85px] ${task.isCompleted ? 'bg-success text-charcoal-base hover:bg-success/90 border-none' : ''}`}
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
                              className="gap-2 px-6 shadow-lg shadow-muted-cyan/20"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTaskModal({ isOpen: false, task: null })}></div>
          <Card className="relative w-full max-w-2xl max-h-[85vh] bg-muted-surface border-white/5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/5 bg-charcoal-base/50 shrink-0">
              <div className="pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary" className="bg-muted-cyan/10 text-muted-cyan border-none">TASK DETAILS</Badge>
                  {taskModal.task.isCompleted && <Badge variant="success">COMPLETED</Badge>}
                </div>
                <h3 className="text-lg font-semibold text-canvas-white leading-snug">{taskModal.task.title}</h3>
              </div>
              <button 
                onClick={() => setTaskModal({ isOpen: false, task: null })}
                className="absolute top-6 right-6 p-2 rounded-lg text-muted-steel hover:text-canvas-white hover:bg-white/[0.05] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-muted-surface">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono text-muted-steel uppercase tracking-wider mb-3">Context & Goal</h4>
                  <p className="text-sm text-canvas-white/80 leading-relaxed bg-charcoal-base p-4 rounded-xl border border-white/5">
                    {taskModal.task.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-mono text-muted-steel uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ListTodo size={14} className="text-muted-cyan" /> Execution Steps
                  </h4>
                  <div className="space-y-3">
                    {taskModal.task.steps && taskModal.task.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-xl bg-charcoal-base border border-white/5 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-cyan/30 group-hover:bg-muted-cyan transition-colors"></div>
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
            <div className="p-5 border-t border-white/5 bg-charcoal-base/50 shrink-0 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTaskModal({ isOpen: false, task: null })}>
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
