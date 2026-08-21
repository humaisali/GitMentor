import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Sparkles, ArrowLeft, CheckCircle2, Circle, Clock, Check, ExternalLink, BookOpen, Layers, Compass, ListTodo, Info, X, Play, Brain, Target, Gauge } from 'lucide-react';
import ProjectChatAssistant from '../components/ProjectChatAssistant';

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

  const handleContinueProject = () => {
    if (!project || !project.phases || project.phases.length === 0) return;
    navigate(`/roadmaps/${projectId}/workspace`);
  };

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
      <header className="mb-2 shrink-0 animate-fade-in-up">
        <button 
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-2 text-sm text-muted-steel hover:text-canvas-white mb-4 transition-all duration-300"
        >
          <ArrowLeft size={16} /> Back to Roadmap
        </button>
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">{project.title}</h1>
            <p className="text-muted-steel mt-2 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <Badge variant={project.status === 'COMPLETED' ? 'success' : 'primary'}>{project.status}</Badge>
            {project.selectedTimeline && (
              <Button 
                variant="primary" 
                className="px-6 py-2.5 text-sm font-medium gap-2"
                onClick={handleContinueProject}
              >
                <Play size={16} /> Continue Project
              </Button>
            )}
          </div>
        </div>
      </header>

      {(project.targetSkills?.length > 0 || project.addressedGaps?.length > 0 || project.skillRationale) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fade-in-up stagger-1">
          <div className="md:col-span-8 glass-card p-6">
            <h3 className="text-lg font-medium text-canvas-white mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted-cyan/10 flex items-center justify-center border border-muted-cyan/20">
                <Brain size={16} className="text-muted-cyan" />
              </div>
              Skill Engine Targeting
            </h3>
            {project.skillRationale && (
              <p className="text-sm text-muted-steel leading-relaxed mb-5">{project.skillRationale}</p>
            )}
            {project.targetSkills?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.targetSkills.map(skill => (
                  <Badge key={skill.slug || skill.name} variant="primary" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-4 glass-card p-6">
            <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-4 uppercase flex items-center gap-2">
              <Gauge size={14} className="text-emerald-400" /> Readiness Track
            </h4>
            <p className="text-sm font-medium text-canvas-white mb-5">{project.readinessTrack || 'Full-Stack Builder Readiness'}</p>
            {project.addressedGaps?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-3 uppercase flex items-center gap-2">
                  <Target size={14} className="text-amber-400" /> Gaps Addressed
                </h4>
                <div className="space-y-2">
                  {project.addressedGaps.slice(0, 3).map(gap => (
                    <p key={gap} className="text-xs text-muted-steel leading-relaxed">{gap}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(!project.detailedPlan || !project.detailedPlan.scope) ? (
        <Card hover={false} className="p-10 flex flex-col items-center justify-center text-center shadow-elevation-3 animate-fade-in-up stagger-1">
          <div className="w-16 h-16 rounded-2xl bg-muted-cyan/10 flex items-center justify-center border border-muted-cyan/20 shadow-[0_0_25px_rgba(88,166,255,0.2)] mb-4 animate-float">
            <Sparkles size={32} className="text-muted-cyan" />
          </div>
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
          <div className="md:col-span-8 glass-card p-7 relative overflow-hidden flex flex-col animate-fade-in-up stagger-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-muted-cyan via-blue-400 to-transparent opacity-60"></div>
            <h3 className="text-xl font-medium text-canvas-white mb-6 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted-cyan/10 flex items-center justify-center border border-muted-cyan/20">
                <Sparkles size={16} className="text-muted-cyan" />
              </div>
              Project Blueprint
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
                      <div className="mt-1 bg-muted-cyan/10 p-1 rounded-full group-hover:bg-muted-cyan/20 group-hover:shadow-[0_0_8px_rgba(88,166,255,0.2)] transition-all duration-300">
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
            <div className="glass-card p-7 flex-1 overflow-hidden min-w-0 animate-fade-in-up stagger-2">
              <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-5 uppercase flex items-center gap-2">
                <Layers size={14} className="text-muted-cyan" /> Tech Stack
              </h4>
              <div className="flex flex-wrap gap-2 w-full">
                {project.detailedPlan.techStack?.map((tech, i) => (
                  <Badge key={i} variant="default" className="px-3 py-1.5 text-xs break-all" style={{ maxWidth: 'calc(100% - 4px)' }}>{tech}</Badge>
                ))}
              </div>
            </div>
            
            {/* Methodologies */}
            <div className="glass-card p-7 flex-1 animate-fade-in-up stagger-3">
              <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-5 uppercase flex items-center gap-2">
                <Compass size={14} className="text-muted-cyan" /> Methodologies
              </h4>
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
            <div className="md:col-span-12 glass-card p-8 relative overflow-hidden animate-fade-in-up stagger-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-muted-cyan/[0.04] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 animate-blob"></div>
              
              <div className="flex flex-col gap-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-6">
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
                    className="w-full md:w-auto px-8 gap-2 py-3.5 text-sm font-medium shrink-0" 
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
                      className={`text-left p-6 rounded-2xl border transition-all duration-300 h-full flex flex-col group backdrop-blur-sm
                        ${selectedOptionId === opt.id 
                          ? 'border-muted-cyan/40 bg-muted-cyan/[0.08] shadow-[0_0_30px_rgba(88,166,255,0.15)] scale-[1.02]' 
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-1'}`}
                    >
                      <div className="mb-4">
                        <span className={`block font-semibold text-lg mb-1 transition-colors ${selectedOptionId === opt.id ? 'text-canvas-white' : 'text-canvas-white/90 group-hover:text-canvas-white'}`}>{opt.title}</span>
                        <span className="inline-block px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-xs font-mono text-muted-cyan">{opt.duration}</span>
                      </div>
                      <p className="text-sm text-muted-steel leading-relaxed">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Timeline & Continue Project */}
          {project.selectedTimeline && (
            <>
              {/* Active Timeline */}
              <div className="md:col-span-8 glass-card p-7 relative overflow-hidden flex flex-col justify-center animate-fade-in-up stagger-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.04] rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <h4 className="text-[11px] font-mono tracking-widest text-muted-steel mb-4 uppercase flex items-center gap-2">
                  <Clock size={14} className="text-emerald-400" /> Active Timeline
                </h4>
                <p className="text-xl font-medium text-canvas-white mb-2">
                  {project.timelineOptions?.find(t => t.id === project.selectedTimeline)?.title || 'Custom Timeline'}
                </p>
                <div className="inline-block px-3 py-1 bg-white/[0.04] rounded-full border border-white/[0.08] text-xs text-muted-cyan font-mono mb-5 self-start">
                  {project.timelineOptions?.find(t => t.id === project.selectedTimeline)?.duration}
                </div>
                <p className="text-[15px] text-muted-steel leading-relaxed pt-5 border-t border-white/[0.06]">
                  {project.timelineOptions?.find(t => t.id === project.selectedTimeline)?.description}
                </p>
              </div>

              {/* Continue Project Action */}
              <div className="md:col-span-4 glass-card p-8 relative overflow-hidden flex flex-col justify-center items-center text-center gap-6 animate-fade-in-up stagger-5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-muted-cyan/[0.04] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 animate-blob"></div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-canvas-white tracking-tight mb-3 flex items-center justify-center gap-2">
                    <Sparkles size={20} className="text-muted-cyan" /> Ready to Build?
                  </h3>
                  <p className="text-sm text-muted-steel leading-relaxed mb-1">
                    Your workspace is ready. Enter the execution phase to start checking off tasks.
                  </p>
                </div>
                
                <Button 
                  variant="primary" 
                  className="w-full py-3.5 text-sm font-medium gap-2 relative z-10"
                  onClick={handleContinueProject}
                >
                  <Play size={18} /> Continue Project
                </Button>
              </div>
            </>
          )}
        </div>
      )}



      {project?.detailedPlan && <ProjectChatAssistant projectId={projectId} />}
    </div>
  );
};

export default ProjectDetails;
