import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Input } from '../components/ui/Input';
import { CheckCircle2, Circle, Lock, Sparkles, X, Brain, Target } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/roadmaps';

const Roadmap = () => {
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { headers });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
      }
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchRoadmap, 0);
    return () => clearTimeout(timer);
    // Initial roadmap hydration intentionally runs once; regeneration is explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: customGoal })
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
        setShowModal(false);
        setCustomGoal('');
      } else {
        console.error('Failed to generate roadmap');
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <header className="mb-4 shrink-0 flex justify-between items-end animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">
            <span className="bg-gradient-to-r from-muted-cyan to-blue-400 bg-clip-text text-transparent">Roadmap</span> Builder
          </h1>
          <p className="text-muted-steel mt-1 font-mono text-sm">Full-Stack Mastery Path</p>
        </div>
        {roadmap.length > 0 && (
          <Button variant="primary" onClick={() => setShowModal(true)} disabled={generating} className="gap-2">
            <Sparkles size={16} />
            {generating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        )}
      </header>

      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </Card>
            ))}
          </div>
        ) : roadmap.length === 0 ? (
          <Card hover={false} className="flex flex-col items-center justify-center h-64 p-8 text-center shadow-elevation-3">
            <div className="w-14 h-14 rounded-2xl bg-muted-cyan/10 flex items-center justify-center border border-muted-cyan/20 shadow-[0_0_20px_rgba(88,166,255,0.15)] mb-4 animate-float">
              <Sparkles size={28} className="text-muted-cyan" />
            </div>
            <h2 className="text-xl font-medium text-canvas-white mb-2">No Roadmap Generated</h2>
            <p className="text-muted-steel mb-6 max-w-md">
              Let our AI analyze your GitHub repositories and generate a personalized learning roadmap to help you reach the next level.
            </p>
            <Button variant="primary" onClick={() => setShowModal(true)} disabled={generating} className="gap-2">
              {generating ? 'Analyzing Repositories...' : 'Generate AI Roadmap'}
            </Button>
          </Card>
        ) : (
          <div className="relative pl-6 ml-3 space-y-8">
            {/* Glowing timeline line */}
            <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-muted-cyan/40 via-muted-cyan/15 to-transparent shadow-[0_0_8px_rgba(88,166,255,0.15)]"></div>
            {roadmap.map((node, index) => (
              <RoadmapNode key={node._id || node.projectId} node={node} index={index} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card hover={false} className="w-full max-w-lg p-6 shadow-elevation-4 relative animate-fade-in-up">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-steel hover:text-canvas-white p-1 rounded-lg hover:bg-white/[0.06] transition-all"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-medium text-canvas-white mb-2 flex items-center gap-2">
              <Sparkles size={20} className="text-muted-cyan" /> Generate Smart Roadmap
            </h2>
            <p className="text-sm text-muted-steel mb-6">
              Our AI will analyze your GitHub repositories to infer your current skill level and create a custom 5-step curriculum to achieve your specific goal.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-mono tracking-wider text-muted-steel mb-2">YOUR GOAL (OPTIONAL)</label>
                <Input 
                  placeholder="e.g., I want to learn Rust for WebAssembly in 30 days"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleGenerate} disabled={generating} className="gap-2">
                {generating ? <Sparkles size={16} className="animate-pulse" /> : <Sparkles size={16} />}
                {generating ? 'Generating...' : 'Generate Curriculum'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const RoadmapNode = ({ node, index }) => {
  const navigate = useNavigate();

  const isCompleted = node.status === 'COMPLETED';
  const isInProgress = node.status === 'IN_PROGRESS';
  const isLocked = node.status === 'LOCKED';

  const statusIcon = isCompleted
    ? <CheckCircle2 size={20} className="text-muted-cyan" />
    : isInProgress
      ? <Circle size={20} className="text-muted-cyan fill-muted-cyan/20" />
      : <Lock size={18} className="text-muted-steel" />;

  const getStatusBadgeVariant = (status) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'IN_PROGRESS') return 'primary';
    return 'default';
  };

  const getDifficultyBadgeVariant = (diff) => {
    if (diff === 'BEGINNER') return 'success';
    if (diff === 'INTERMEDIATE') return 'warning';
    if (diff === 'ADVANCED') return 'error';
    return 'default';
  };

  return (
    <div className={`relative group animate-fade-in-up stagger-${Math.min((index % 6) + 1, 6)}`}>
      {/* Timeline Node Connector */}
      <div className="absolute -left-[35px] top-4 flex items-center justify-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-bg-deep border ${isInProgress ? 'border-muted-cyan shadow-[0_0_12px_rgba(88,166,255,0.3)]' : isCompleted ? 'border-muted-cyan/40' : 'border-white/[0.1]'}`}>
          {statusIcon}
        </div>
      </div>

      <Card className={`p-6 transition-all duration-300 ${isInProgress ? 'border-muted-cyan/30 shadow-[0_0_20px_rgba(88,166,255,0.08)]' : ''} ${isLocked ? 'opacity-50 grayscale' : ''}`}>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-xl font-medium tracking-tight ${isInProgress ? 'text-muted-cyan' : 'text-canvas-white'}`}>
                {node.title}
              </h3>
            </div>
            
            <p className="text-muted-steel text-sm leading-relaxed mb-6">
              {node.description}
            </p>

            {(node.targetSkills?.length > 0 || node.addressedGaps?.length > 0) && (
              <div className="glass-surface p-4 mb-5">
                {node.targetSkills?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-muted-steel uppercase mb-2">
                      <Brain size={13} className="text-muted-cyan" /> Target Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {node.targetSkills.slice(0, 4).map(skill => (
                        <span key={skill.slug || skill.name} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-muted-cyan/10 border border-muted-cyan/20 text-muted-cyan">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {node.addressedGaps?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-muted-steel uppercase mb-2">
                      <Target size={13} className="text-amber-400" /> Skill Gaps
                    </div>
                    <div className="space-y-1">
                      {node.addressedGaps.slice(0, 2).map(gap => (
                        <p key={gap} className="text-xs text-muted-steel leading-relaxed">{gap}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-steel/70 font-mono tracking-wider">EST. TIME</span>
                <span className="text-xs font-mono text-canvas-white">{node.estTime}</span>
              </div>
              <div className="w-px h-8 bg-white/[0.06]"></div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-steel/70 font-mono tracking-wider">PREREQUISITE</span>
                <span className="text-xs font-mono text-canvas-white">{node.prereq}</span>
              </div>
              <div className="w-px h-8 bg-white/[0.06] hidden md:block"></div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-steel/70 font-mono tracking-wider">SYSTEM ID</span>
                <span className="text-xs font-mono text-muted-steel">{node.projectId}</span>
              </div>
              {node.readinessTrack && (
                <>
                  <div className="w-px h-8 bg-white/[0.06] hidden md:block"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-steel/70 font-mono tracking-wider">IMPROVES</span>
                    <span className="text-xs font-mono text-canvas-white">{node.readinessTrack}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 border-white/[0.06] pt-4 md:pt-0">
             <Badge variant={getStatusBadgeVariant(node.status)}>{node.status}</Badge>
             <Badge variant={getDifficultyBadgeVariant(node.difficulty)}>{node.difficulty}</Badge>
             {!isCompleted && !isLocked && (
               <div className="flex gap-2 mt-2">
                 <Button variant="primary" className="h-8 text-xs px-3" onClick={() => navigate(`/roadmaps/${node.projectId}`)}>
                   Start Project
                 </Button>
               </div>
             )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Roadmap;
