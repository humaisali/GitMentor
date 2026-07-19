import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Sparkles, ArrowLeft, CheckCircle2, Circle, Clock, Check } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/roadmaps';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingTimeline, setGeneratingTimeline] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [completingPhase, setCompletingPhase] = useState(null);

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchProject = async () => {
    try {
      const res = await fetch(API_BASE, { headers });
      if (res.ok) {
        const roadmaps = await res.json();
        const found = roadmaps.find(p => p.projectId === projectId);
        setProject(found);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/plan`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSelectTimeline = async () => {
    if (!selectedOptionId) return;
    setGeneratingTimeline(true);
    try {
      const res = await fetch(`${API_BASE}/${projectId}/timeline`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timelineId: selectedOptionId })
      });
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingTimeline(false);
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
        const updated = await res.json();
        setProject(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingPhase(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto h-full p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card className="p-8">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
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
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-full p-4 overflow-auto pb-10">
      <header className="mb-2 shrink-0">
        <button 
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-2 text-sm text-muted-steel hover:text-canvas-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Roadmap
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">{project.title}</h1>
            <p className="text-muted-steel mt-2 max-w-2xl">{project.description}</p>
          </div>
          <Badge variant={project.status === 'COMPLETED' ? 'success' : 'primary'}>{project.status}</Badge>
        </div>
      </header>

      {(!project.detailedPlan || !project.detailedPlan.scope) ? (
        <Card className="p-10 flex flex-col items-center justify-center text-center border-whisper bg-muted-surface">
          <Sparkles size={40} className="text-muted-cyan mb-4" />
          <h2 className="text-xl font-medium text-canvas-white mb-2">Generate Deep Dive Plan</h2>
          <p className="text-muted-steel mb-6 max-w-lg">
            Ready to start building? Let our AI generate a comprehensive project scope, tech stack recommendations, and timeline options tailored to this exact project.
          </p>
          <Button variant="primary" onClick={handleGeneratePlan} disabled={generatingPlan} className="gap-2 px-6">
            {generatingPlan ? <Sparkles size={16} className="animate-pulse" /> : <Sparkles size={16} />}
            {generatingPlan ? 'Drafting Blueprint...' : 'Generate Project Blueprint'}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-min">
          {/* Blueprint: Scope & Objectives */}
          <div className="md:col-span-8 bg-muted-surface rounded-2xl p-7 shadow-lg relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-muted-cyan to-transparent opacity-50"></div>
            <h3 className="text-xl font-medium text-canvas-white mb-6 flex items-center gap-2">
              <Sparkles size={20} className="text-muted-cyan" /> Project Blueprint
            </h3>
            
            <div className="space-y-8 flex-1">
              <div>
                <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-3 uppercase">Scope & Context</h4>
                <p className="text-[15px] text-canvas-white/80 leading-relaxed">
                  {project.detailedPlan.scope}
                </p>
              </div>
              
              <div>
                <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-4 uppercase">Key Objectives</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {project.detailedPlan.objectives?.map((obj, i) => (
                    <div key={i} className="flex gap-3 items-start group">
                      <div className="mt-1 bg-muted-cyan/10 p-1 rounded-full group-hover:bg-muted-cyan/20 transition-colors">
                        <Check size={14} className="text-muted-cyan shrink-0" />
                      </div>
                      <span className="text-sm text-canvas-white/90 leading-relaxed">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar stack */}
          <div className="md:col-span-4 flex flex-col gap-5">
            {/* Tech Stack */}
            <div className="bg-muted-surface rounded-2xl p-7 shadow-lg flex-1">
              <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-5 uppercase">Tech Stack</h4>
              <div className="flex flex-wrap gap-2.5">
                {project.detailedPlan.techStack?.map((tech, i) => (
                  <Badge key={i} variant="default" className="px-3 py-1.5 text-xs bg-muted-surface/50 border-whisper/30 text-canvas-white/80">{tech}</Badge>
                ))}
              </div>
            </div>
            
            {/* Methodologies */}
            <div className="bg-muted-surface rounded-2xl p-7 shadow-lg flex-1">
              <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-5 uppercase">Methodologies</h4>
              <div className="flex flex-col gap-4">
                {project.detailedPlan.methodologies?.map((meth, i) => (
                  <div key={i} className="text-sm text-canvas-white/90 flex items-center gap-3">
                    <Circle size={8} className="text-muted-cyan fill-muted-cyan/50" />
                    {meth}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Choose Pace Bento Block */}
          {!project.selectedTimeline && project.timelineOptions && (
            <div className="md:col-span-12 bg-muted-surface rounded-2xl p-8 shadow-xl shadow-muted-cyan/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-muted-cyan/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex flex-col gap-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-whisper/40 pb-6">
                  <div className="max-w-3xl">
                    <Badge variant="primary" className="bg-muted-cyan/10 text-muted-cyan border-none mb-3">TIMELINE SELECTION</Badge>
                    <h3 className="text-2xl font-semibold text-canvas-white tracking-tight mb-2">
                      Choose Your Pace
                    </h3>
                    <p className="text-[15px] text-muted-steel leading-relaxed">
                      Select a timeline option to break this project down into actionable execution phases tailored to your availability.
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    className="w-full md:w-auto px-8 gap-2 py-3.5 text-sm font-medium rounded-xl shadow-lg shadow-muted-cyan/20 shrink-0" 
                    disabled={!selectedOptionId || generatingTimeline}
                    onClick={handleSelectTimeline}
                  >
                    {generatingTimeline ? <Sparkles size={18} className="animate-pulse" /> : <Clock size={18} />}
                    {generatingTimeline ? 'Generating...' : 'Confirm Timeline'}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {project.timelineOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`text-left p-6 rounded-2xl border transition-all h-full flex flex-col group
                        ${selectedOptionId === opt.id 
                          ? 'border-muted-cyan bg-muted-cyan/10 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-[1.02]' 
                          : 'border-whisper bg-charcoal-base hover:border-muted-steel/50 hover:bg-muted-surface hover:-translate-y-1'}`}
                    >
                      <div className="mb-4">
                        <span className={`block font-semibold text-lg mb-1 transition-colors ${selectedOptionId === opt.id ? 'text-canvas-white' : 'text-canvas-white/90 group-hover:text-canvas-white'}`}>{opt.title}</span>
                        <span className="inline-block px-3 py-1 bg-charcoal-base border border-whisper rounded-full text-xs font-mono text-muted-cyan">{opt.duration}</span>
                      </div>
                      <p className="text-sm text-muted-steel leading-relaxed">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Timeline & Execution Phases */}
          {project.selectedTimeline && (
             <div className="md:col-span-4 bg-muted-surface rounded-2xl p-7 shadow-lg relative overflow-hidden h-fit self-start">
               <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
               <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-4 uppercase flex items-center gap-2">
                 <Clock size={14} className="text-success" /> Active Timeline
               </h4>
               <p className="text-xl font-medium text-canvas-white mb-2">
                 {project.timelineOptions?.find(t => t.id === project.selectedTimeline)?.title || 'Custom Timeline'}
               </p>
               <div className="inline-block px-3 py-1 bg-muted-surface rounded-full border border-whisper/50 text-xs text-muted-cyan font-mono mb-5">
                 {project.timelineOptions?.find(t => t.id === project.selectedTimeline)?.duration}
               </div>
               <p className="text-[15px] text-muted-steel leading-relaxed pt-5 border-t border-whisper/30">
                 {project.timelineOptions?.find(t => t.id === project.selectedTimeline)?.description}
               </p>
             </div>
          )}

          {project.selectedTimeline && project.phases && project.phases.length > 0 && (
            <div className="md:col-span-8 bg-muted-surface rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-medium text-canvas-white mb-8 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-muted-cyan" /> Execution Phases
              </h3>
              
              <div className="space-y-5 relative">
                <div className="absolute top-6 bottom-6 left-[21px] w-0.5 bg-whisper/60"></div>
                
                {project.phases.map((phase, idx) => {
                  const isCompleted = phase.isCompleted;
                  const previousPhasesCompleted = project.phases.slice(0, idx).every(p => p.isCompleted);
                  const isUnlocked = previousPhasesCompleted || isCompleted;

                  return (
                    <div key={phase.phaseId} className={`relative flex gap-6 p-5 rounded-xl border transition-all 
                      ${isCompleted 
                        ? 'bg-muted-surface/30 border-whisper/30' 
                        : isUnlocked 
                          ? 'bg-muted-surface/80 border-muted-cyan/40 shadow-lg shadow-muted-cyan/5' 
                          : 'bg-charcoal-base/20 border-transparent opacity-40 grayscale'}`}>
                      
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
                          <h4 className={`text-lg font-medium truncate pr-4 ${isCompleted ? 'text-muted-steel line-through' : 'text-canvas-white'}`}>
                            {phase.title}
                          </h4>
                          <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-charcoal-base border border-whisper text-muted-steel">
                            {phase.estimatedTime}
                          </span>
                        </div>
                        <p className="text-[15px] text-muted-steel leading-relaxed mb-4">{phase.description}</p>
                        
                        {isUnlocked && !isCompleted && (
                          <Button 
                            variant="primary" 
                            className="text-sm px-5 py-2 h-auto rounded-lg shadow-md"
                            disabled={completingPhase === phase.phaseId}
                            onClick={() => handleCompletePhase(phase.phaseId)}
                          >
                            {completingPhase === phase.phaseId ? 'Completing...' : 'Mark Phase Complete'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
