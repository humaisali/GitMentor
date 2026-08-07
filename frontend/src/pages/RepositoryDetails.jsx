import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Zap, Layers, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

const RepositoryDetails = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const repo = state?.repo;

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      navigate('/repositories');
      return;
    }
    fetchInsights();
  }, [repo, id]);

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

  if (!repo) return null;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="shrink-0 flex items-start gap-4">
        <button onClick={() => navigate('/repositories')} className="mt-1 p-2 rounded-md hover:bg-whisper transition-colors">
          <ArrowLeft size={20} className="text-muted-steel hover:text-canvas-white" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">{repo.name}</h1>
            <Badge variant="outline">{repo.language}</Badge>
          </div>
          <p className="text-muted-steel mt-1 font-mono text-sm">{repo.fullName}</p>
        </div>
      </header>

      <div className="flex-1 pr-2 pb-10">
        <div className="mb-6">
          <h2 className="text-xl font-medium text-canvas-white mb-2">Deep AI Repository Analysis</h2>
          <p className="text-muted-steel text-sm max-w-3xl">
            GitMentor AI has analyzed your repository's top-level structure, README, and recent commit history to provide hyper-specific architectural and security insights.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-steel gap-4">
             <Loader2 size={32} className="animate-spin text-muted-cyan" />
             <p className="animate-pulse">AI is reading your codebase and generating insights...</p>
             <p className="text-xs font-mono opacity-50">This may take 5-10 seconds depending on repo size.</p>
          </div>
        ) : insights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map(insight => (
              <Card key={insight._id} className={`p-6 flex flex-col border-l-4 transition-all duration-200 h-full ${insight.isResolved ? 'bg-charcoal-base/50 opacity-60' : 'bg-charcoal-base shadow-md hover:shadow-lg hover:-translate-y-0.5'}`} style={{ borderLeftColor: insight.isResolved ? '#6b7280' : insight.severity === 'error' ? '#ef4444' : insight.severity === 'warning' ? '#eab308' : '#3b82f6' }}>
                <div className="flex items-start gap-3 mb-4 shrink-0">
                  <div className="mt-1 shrink-0">{getIcon(insight.type)}</div>
                  <div className="flex-1 w-full flex justify-between items-start gap-4">
                    <h3 className="text-base font-semibold text-canvas-white leading-snug line-clamp-2 h-[44px]">{insight.title}</h3>
                    <Badge variant="outline" className="shrink-0 text-[10px] font-mono tracking-wider opacity-80 border-white/20 text-muted-steel mt-0.5">{insight.type}</Badge>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <p className="text-muted-steel text-sm leading-relaxed mb-4 line-clamp-[8] h-[185px]">{insight.description}</p>
                  
                  {insight.suggestedSolution && (
                    <div className="mt-auto bg-black/25 p-4 rounded-lg flex-1">
                      <h4 className="text-canvas-white text-[11px] font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap size={14} className="text-emerald-400" />
                        Suggested Solution
                      </h4>
                      <p className="text-muted-cyan/90 text-sm leading-relaxed">{insight.suggestedSolution}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center shrink-0">
                  <div className="text-xs font-mono text-muted-steel truncate pr-4">
                    Target: <span className="text-canvas-white">{insight.file}</span>
                  </div>
                  {!insight.isResolved ? (
                    <button 
                      onClick={() => handleResolve(insight._id)}
                      className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Solve Issue
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-muted-steel flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-md">
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
