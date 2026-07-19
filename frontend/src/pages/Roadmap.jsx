import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Input } from '../components/ui/Input';
import { CheckCircle2, Circle, Lock, Sparkles, X } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/roadmaps';

const Roadmap = () => {
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchRoadmap();
  }, []);

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
    <div className="flex flex-col gap-6 max-w-3xl mx-auto h-full">
      <header className="mb-4 shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Roadmap Builder</h1>
          <p className="text-muted-steel mt-1 font-mono text-sm">Full-Stack Mastery Path</p>
        </div>
        {roadmap.length > 0 && (
          <Button variant="primary" onClick={() => setShowModal(true)} disabled={generating} className="gap-2">
            <Sparkles size={16} />
            {generating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-auto pb-10">
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
          <div className="flex flex-col items-center justify-center h-64 border border-whisper rounded-lg bg-surface-dim p-8 text-center">
            <Sparkles size={32} className="text-muted-cyan mb-4" />
            <h2 className="text-xl font-medium text-canvas-white mb-2">No Roadmap Generated</h2>
            <p className="text-muted-steel mb-6 max-w-md">
              Let our AI analyze your GitHub repositories and generate a personalized learning roadmap to help you reach the next level.
            </p>
            <Button variant="primary" onClick={() => setShowModal(true)} disabled={generating} className="gap-2">
              {generating ? 'Analyzing Repositories...' : 'Generate AI Roadmap'}
            </Button>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-whisper ml-3 space-y-8">
            {roadmap.map((node, index) => (
              <RoadmapNode key={node._id || node.projectId} node={node} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-charcoal-base border-whisper shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-steel hover:text-canvas-white"
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
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
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

const RoadmapNode = ({ node }) => {
  const navigate = useNavigate();

  const isCompleted = node.status === 'COMPLETED';
  const isInProgress = node.status === 'IN_PROGRESS';
  const isLocked = node.status === 'LOCKED';

  const StatusIcon = () => {
    if (isCompleted) return <CheckCircle2 size={20} className="text-muted-cyan bg-charcoal-base" />;
    if (isInProgress) return <Circle size={20} className="text-muted-cyan bg-charcoal-base fill-muted-cyan/20" />;
    return <Lock size={18} className="text-muted-steel bg-charcoal-base" />;
  };

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
    <div className="relative group">
      {/* Timeline Node Connector */}
      <div className="absolute -left-[35px] top-4 flex items-center justify-center">
        <StatusIcon />
      </div>

      <Card className={`p-6 transition-all duration-300 ${isInProgress ? 'border-muted-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'hover:border-muted-steel/30'} ${isLocked ? 'opacity-60 grayscale' : ''}`}>
        
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
            
            <div className="flex flex-wrap items-center gap-4 border-t border-whisper pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-steel/70 font-mono tracking-wider">EST. TIME</span>
                <span className="text-xs font-mono text-canvas-white">{node.estTime}</span>
              </div>
              <div className="w-px h-8 bg-whisper"></div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-steel/70 font-mono tracking-wider">PREREQUISITE</span>
                <span className="text-xs font-mono text-canvas-white">{node.prereq}</span>
              </div>
              <div className="w-px h-8 bg-whisper hidden md:block"></div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-steel/70 font-mono tracking-wider">SYSTEM ID</span>
                <span className="text-xs font-mono text-muted-steel">{node.projectId}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 border-whisper pt-4 md:pt-0">
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
