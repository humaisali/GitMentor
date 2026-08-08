import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

export const SystemMetricsWidget = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('gitmentor_token');
        const res = await fetch('http://localhost:5000/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <Card className="flex flex-col h-full">
      <div className="p-5 border-b border-white/[0.06] shrink-0">
        <h2 className="text-lg font-medium text-canvas-white">Developer Progress</h2>
      </div>
      
      <div className="p-5 grid grid-cols-2 gap-3 flex-1 content-start">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : metrics ? (
          <>
            <MetricCard label="Roadmaps Done" value={metrics.roadmapsCompleted} index={0} />
            <MetricCard label="Tasks Completed" value={metrics.tasksCompleted} index={1} />
            <MetricCard label="Insights Fixed" value={metrics.insightsFixed} index={2} />
            <MetricCard label="Repos Tracked" value={metrics.reposTracked} index={3} />
          </>
        ) : (
          <div className="col-span-2 text-center text-sm text-muted-steel mt-4">Failed to load metrics.</div>
        )}
      </div>
    </Card>
  );
};

const MetricCard = ({ label, value, index }) => (
  <div className={`p-4 glass-surface flex flex-col justify-center gap-1.5 transition-all duration-300 hover:border-muted-cyan/20 hover:shadow-[0_0_15px_rgba(88,166,255,0.08)] hover:-translate-y-0.5 animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
    <span className="text-[10px] text-muted-steel uppercase tracking-wider font-mono">{label}</span>
    <span className="text-2xl font-mono text-canvas-white font-semibold">{value}</span>
  </div>
);
