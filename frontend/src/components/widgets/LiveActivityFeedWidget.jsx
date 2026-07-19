import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Activity, GitCommit, GitPullRequest, MessageSquare, Star, Terminal } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

export const LiveActivityFeedWidget = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('gitmentor_token');
      const res = await fetch('http://localhost:5000/api/analytics/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type) => {
    switch(type) {
      case 'PushEvent': return <GitCommit size={16} className="text-emerald-500" />;
      case 'PullRequestEvent': return <GitPullRequest size={16} className="text-blue-500" />;
      case 'IssuesEvent': return <MessageSquare size={16} className="text-orange-500" />;
      case 'WatchEvent': return <Star size={16} className="text-yellow-500" />;
      default: return <Terminal size={16} className="text-muted-steel" />;
    }
  };

  const getEventDescription = (event) => {
    switch(event.type) {
      case 'PushEvent': 
        const commits = event.payload.commits?.length || 0;
        return `Pushed ${commits} commit${commits !== 1 ? 's' : ''} to ${event.repo.name}`;
      case 'PullRequestEvent': 
        return `${event.payload.action === 'opened' ? 'Opened' : 'Updated'} pull request in ${event.repo.name}`;
      case 'IssuesEvent': 
        return `${event.payload.action === 'opened' ? 'Opened' : 'Updated'} issue in ${event.repo.name}`;
      case 'WatchEvent': 
        return `Starred ${event.repo.name}`;
      default: 
        return `${event.type.replace('Event', '')} on ${event.repo.name}`;
    }
  };

  return (
    <Card className="flex flex-col h-full p-6 flex-1 min-h-[350px]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-lg font-medium text-canvas-white flex items-center gap-2">
          <Activity size={18} className="text-muted-cyan animate-pulse" /> Live Activity Feed
        </h3>
        <span className="text-xs text-muted-steel font-mono bg-charcoal-base px-2 py-1 rounded-md">Auto-sync: 60s</span>
      </div>
      
      <div className="flex-1 overflow-auto relative custom-scrollbar pr-2">
        <div className="absolute top-0 bottom-0 left-4 w-px bg-whisper/50 z-0"></div>
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : events.length > 0 ? (
          <div className="flex flex-col gap-5 relative z-10">
            {events.slice(0, 15).map(event => (
              <div key={event.id} className="flex gap-4 items-start group">
                <div className="shrink-0 w-8 h-8 rounded-full bg-charcoal-base border border-whisper flex items-center justify-center relative z-10 group-hover:border-muted-cyan/50 group-hover:bg-muted-cyan/10 transition-colors">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 bg-charcoal-base p-4 rounded-xl border border-transparent group-hover:border-muted-cyan/30 group-hover:bg-charcoal-base/80 transition-colors -mt-1 shadow-sm">
                  <p className="text-sm text-canvas-white font-medium leading-tight mb-1.5">{getEventDescription(event)}</p>
                  <p className="text-[11px] font-mono text-muted-steel">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-steel text-center mt-10 relative z-10">No recent GitHub activity found.</div>
        )}
      </div>
    </Card>
  );
};
