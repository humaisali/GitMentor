import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Zap, Layers, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const RepositoryDetails = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const repo = state?.repo;

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (insights.length > 0 && state?.highlightInsightId) {
      setTimeout(() => {
        const el = document.getElementById(`insight-${state.highlightInsightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-muted-cyan', 'ring-offset-2', 'ring-offset-bg-deep');
          setTimeout(() => el.classList.remove('ring-2', 'ring-muted-cyan', 'ring-offset-2', 'ring-offset-bg-deep'), 2500);
        }
      }, 100);
    }
  }, [insights, state?.highlightInsightId]);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('gitmentor_token');
      const res = await fetch(`http://localhost:5000/api/insights/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error('Error fetching insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!repo) {
      navigate('/repositories');
      return undefined;
    }
    const timer = setTimeout(fetchInsights, 0);
    return () => clearTimeout(timer);
    // The request is keyed by route identity; the local fetch closure is not reactive state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, id, navigate]);

  const handleResolve = async (insightId) => {
    try {
      const token = localStorage.getItem('gitmentor_token');
      const res = await fetch(`http://localhost:5000/api/insights/${insightId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInsights(insights.map(i => i._id === insightId ? { ...i, isResolved: true } : i));
      }
    } catch (err) {
      console.error('Error resolving insight', err);
    }
  };

  const getIcon = (type) => {
    if (type === 'VULNERABILITY') return <ShieldAlert className="text-red-500" size={20} />;
    if (type === 'PERFORMANCE') return <Zap className="text-yellow-500" size={20} />;
    if (type === 'ARCHITECTURE') return <Layers className="text-blue-500" size={20} />;
    if (type === 'BEST_PRACTICE') return <CheckCircle2 className="text-green-500" size={20} />;
    return <Info className="text-muted-steel" size={20} />;
  };

  const getBorderGlowColor = (severity, isResolved) => {
    if (isResolved) return 'rgba(107,114,128,0.4)';
    if (severity === 'error') return 'rgba(239,68,68,0.5)';
    if (severity === 'warning') return 'rgba(234,179,8,0.5)';
    return 'rgba(59,130,246,0.5)';
  };

  if (!repo) return null;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="shrink-0 flex items-start gap-4 animate-fade-in-up">
        <button onClick={() => navigate('/repositories')} className="mt-1 p-2 rounded-xl hover:bg-white/[0.06] transition-all duration-300">
          <ArrowLeft size={20} className="text-muted-steel hover:text-canvas-white" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">{repo.name}</h1>
            <Badge variant="outline">{repo.language || 'Unknown'}</Badge>
          </div>
          <p className="text-muted-steel mt-1 font-mono text-sm">{repo.fullName}</p>
        </div>
      </header>

      <div className="flex-1 pr-2 pb-10">
        <div className="mb-6 animate-fade-in-up stagger-1">
          <h2 className="text-xl font-medium text-canvas-white mb-2">Deep AI Repository Analysis</h2>
          <p className="text-muted-steel text-sm max-w-3xl">
            GitMentor AI has analyzed your repository's top-level structure, README, and recent commit history to provide hyper-specific architectural and security insights.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-steel gap-4">
             <div className="relative w-12 h-12 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-muted-cyan/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
               <div className="absolute inset-0 border-2 border-muted-cyan border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
               <Loader2 size={20} className="text-muted-cyan absolute" />
             </div>
             <p className="animate-pulse">AI is reading your codebase and generating insights...</p>
             <p className="text-xs font-mono opacity-50">This may take 5-10 seconds depending on repo size.</p>
          </div>
        ) : insights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <Card 
                id={`insight-${insight._id}`} 
                key={insight._id} 
                hover={!insight.isResolved}
                className={`p-6 flex flex-col border-l-4 transition-all duration-500 h-full animate-fade-in-up stagger-${Math.min((index % 6) + 1, 6)} ${insight.isResolved ? 'opacity-50' : 'hover:shadow-elevation-3'}`} 
                style={{ 
                  borderLeftColor: getBorderGlowColor(insight.severity, insight.isResolved),
                  boxShadow: insight.isResolved ? undefined : `var(--elevation-2), -4px 0 15px ${getBorderGlowColor(insight.severity, insight.isResolved).replace('0.5', '0.1')}`
                }}
              >
                <div className="flex items-start gap-3 mb-4 shrink-0">
                  <div className="mt-1 shrink-0">{getIcon(insight.type)}</div>
                  <div className="flex-1 w-full flex justify-between items-start gap-4">
                    <h3 className="text-base font-semibold text-canvas-white leading-snug line-clamp-2 h-[44px]">{insight.title}</h3>
                    <Badge variant="outline" className="shrink-0 text-[10px] font-mono tracking-wider">{insight.type}</Badge>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <p className="text-muted-steel text-sm leading-relaxed mb-4 line-clamp-[8] h-[185px]">{insight.description}</p>
                  
                  {insight.suggestedSolution && (
                    <div className="mt-auto glass-surface p-4 flex-1">
                      <h4 className="text-canvas-white text-[11px] font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap size={14} className="text-emerald-400" />
                        Suggested Solution
                      </h4>
                      <p className="text-muted-cyan/90 text-sm leading-relaxed">{insight.suggestedSolution}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 pt-4 border-t border-white/[0.06] flex justify-between items-center shrink-0">
                  <div className="text-xs font-mono text-muted-steel truncate pr-4">
                    Target: <span className="text-canvas-white">{insight.file}</span>
                  </div>
                  {!insight.isResolved ? (
                    <button 
                      onClick={() => handleResolve(insight._id)}
                      className="shrink-0 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] text-bg-deep px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Solve Issue
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-muted-steel flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl">
                      <CheckCircle2 size={14} />
                      Solved
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-steel mt-20">
            No insights found for this repository.
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryDetails;
