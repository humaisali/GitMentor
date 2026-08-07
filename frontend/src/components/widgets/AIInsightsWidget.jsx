import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { ShieldAlert, Zap, BookOpen, Check } from 'lucide-react';

const getIcon = (type) => {
  switch(type) {
    case 'VULNERABILITY': return <ShieldAlert size={16} className="text-red-400" />;
    case 'PERFORMANCE': return <Zap size={16} className="text-amber-400" />;
    case 'BEST_PRACTICE': return <BookOpen size={16} className="text-muted-cyan" />;
    default: return <BookOpen size={16} />;
  }
};

export const AIInsightsWidget = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('gitmentor_token');
      const response = await fetch('http://localhost:5000/api/insights/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Server returned an error');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setInsights(data);
      } else {
        setInsights([]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleResolve = async (id) => {
    try {
      const token = localStorage.getItem('gitmentor_token');
      const res = await fetch(`http://localhost:5000/api/insights/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInsights(prev => prev.filter(insight => (insight._id || insight.id) !== id));
      }
    } catch (err) {
      console.error('Failed to resolve insight', err);
    }
  };

  return (
    <Card className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-lg font-medium text-canvas-white">Actionable Insights</h2>
        {!loading && <Badge variant="default" className="text-xs bg-charcoal-base">{insights.length} PENDING</Badge>}
      </div>
      
      <div className="space-y-4">
        {loading ? (
          // Loading Skeletons
          [1, 2].map(i => (
            <div key={i} className="p-5 rounded-xl bg-charcoal-base flex flex-col gap-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="border-t border-whisper pt-3 mt-2 flex justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))
        ) : insights.length === 0 ? (
           <div className="h-full flex items-center justify-center text-muted-steel text-sm py-10">No critical insights found. Great job!</div>
        ) : (
          insights.map(insight => {
            const id = insight._id || insight.id;
            return (
              <div key={id} className="p-5 rounded-xl bg-charcoal-base flex flex-col gap-3 group transition-colors border border-transparent hover:border-muted-cyan/30 hover:bg-charcoal-base/80">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(insight.type)}
                    <span className="font-medium text-sm text-canvas-white">{insight.title}</span>
                  </div>
                  <Badge variant={insight.severity}>{insight.type}</Badge>
                </div>
                
                <p className="text-sm text-muted-steel leading-relaxed">
                  {insight.description}
                </p>
                {insight.suggestedSolution && (
                  <p className="text-sm text-muted-cyan leading-relaxed mt-1 bg-surface-dim p-2 rounded border border-whisper">
                    <span className="font-semibold">Fix:</span> {insight.suggestedSolution}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-whisper">
                  <div className="flex items-center gap-3">
                    {insight.repository && insight.repository.name && (
                      <span className="text-xs font-mono text-muted-steel max-w-[120px] truncate">{insight.repository.name}</span>
                    )}
                    <span className="text-xs font-mono text-muted-steel truncate max-w-[150px]">{insight.file}</span>
                  </div>
                  <Button variant="ghost" className="h-7 text-xs px-2 hover:bg-emerald-500/10 hover:text-emerald-500" onClick={() => handleResolve(id)}>
                    <Check size={14} className="mr-1" /> Resolve
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
