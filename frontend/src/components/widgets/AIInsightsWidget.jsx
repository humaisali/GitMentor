import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { ShieldAlert, Zap, BookOpen, ExternalLink } from 'lucide-react';

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

  return (
    <Card className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-lg font-medium text-canvas-white">Pending Fixes</h2>
        {!loading && <Badge variant="default">{insights.length} PENDING</Badge>}
      </div>
      
      <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2 py-2">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl glass-surface flex items-center justify-between">
              <div className="flex flex-col gap-2 w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : insights.length === 0 ? (
           <div className="h-full flex items-center justify-center text-muted-steel text-sm py-10">No pending fixes found. Great job!</div>
        ) : (
          insights.map((insight, index) => {
            const id = insight._id || insight.id;
            const repoId = insight.repository?._id || insight.repository;
            return (
              <div 
                key={id} 
                className={`p-4 rounded-xl glass-surface flex items-center justify-between group transition-all duration-300 hover:border-muted-cyan/20 hover:shadow-[0_0_15px_rgba(88,166,255,0.08)] hover:-translate-y-0.5 animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                <div className="flex flex-col gap-1.5 overflow-hidden pr-4 w-full">
                  <div className="flex items-center gap-2">
                    {getIcon(insight.type)}
                    <span className="font-medium text-sm text-canvas-white truncate" title={insight.title}>{insight.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-steel">
                    <span className="bg-white/[0.04] px-1.5 py-0.5 rounded text-[10px] text-muted-cyan border border-white/[0.06]">{insight.type}</span>
                    <span className="truncate max-w-[200px]" title={insight.file}>{insight.file}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/repositories/${repoId}`} state={{ repo: insight.repository, highlightInsightId: insight._id }}>
                    <Button variant="ghost" className="h-7 text-xs px-2 hover:text-muted-cyan" title="Go to specific insight">
                      <ExternalLink size={14} className="mr-1" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
