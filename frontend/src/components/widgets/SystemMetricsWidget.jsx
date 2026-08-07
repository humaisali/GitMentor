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
      <div className="p-5 border-b border-whisper shrink-0">
        <h2 className="text-lg font-medium text-canvas-white">Developer Progress</h2>
      </div>
      
      <div className="p-5 grid grid-cols-2 gap-4 flex-1 content-start">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : metrics ? (
          <>
            <MetricCard label="Roadmaps Done" value={metrics.roadmapsCompleted} />
            <MetricCard label="Tasks Completed" value={metrics.tasksCompleted} />
            <MetricCard label="Insights Fixed" value={metrics.insightsFixed} />
            <MetricCard label="Repos Tracked" value={metrics.reposTracked} />
          </>
        ) : (
          <div className="col-span-2 text-center text-sm text-muted-steel mt-4">Failed to load metrics.</div>
        )}
      </div>
    </Card>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="p-3 border border-whisper rounded bg-charcoal-base flex flex-col justify-center gap-1 transition-colors hover:border-muted-cyan/30">
    <span className="text-[10px] text-muted-steel uppercase tracking-wider">{label}</span>
    <span className="text-xl font-mono text-canvas-white">{value}</span>
  </div>
);
