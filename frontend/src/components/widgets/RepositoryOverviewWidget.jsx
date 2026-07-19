import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { GitBranch, GitCommit, GitMerge } from 'lucide-react';

export const RepositoryOverviewWidget = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const token = localStorage.getItem('gitmentor_token');
        const response = await fetch('http://localhost:5000/api/repositories/tracked', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setRepositories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching repositories:', error);
        setRepositories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return (
    <Card className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-lg font-medium text-canvas-white">Active Repositories</h2>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 overflow-auto custom-scrollbar pr-2">
        {loading ? (
          // Loading Skeletons
          [1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-charcoal-base flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))
        ) : repositories.length === 0 ? (
          <div className="p-8 text-center text-muted-steel text-sm">No repositories connected.</div>
        ) : (
          repositories.map(repo => (
            <div key={repo._id || repo.id} className="p-4 rounded-xl bg-charcoal-base border border-transparent hover:border-muted-cyan/30 hover:bg-charcoal-base/80 flex items-center justify-between transition-colors shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-charcoal-base border border-whisper flex items-center justify-center">
                  <GitMerge size={16} className="text-muted-steel" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-canvas-white">{repo.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <GitBranch size={12} className="text-muted-steel" />
                    <span className="text-xs font-mono text-muted-steel">{repo.branch || 'main'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <Badge variant={repo.status === 'success' ? 'success' : repo.status === 'error' ? 'error' : 'primary'}>
                    {(repo.status || 'success').toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1 mt-1 text-muted-steel">
                    <GitCommit size={12} />
                    <span className="text-xs font-mono">{repo.lastCommit ? repo.lastCommit.substring(0, 7) : 'pending'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
