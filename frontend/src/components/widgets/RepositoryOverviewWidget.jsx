import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { GitBranch, GitCommit, GitMerge } from 'lucide-react';
import { API_URL } from '../../services/apiClient';

export const RepositoryOverviewWidget = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const token = localStorage.getItem('gitmentor_token');
        const response = await fetch(`${API_URL}/repositories/tracked`, {
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
    <Card className="flex flex-col p-6 h-full">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-lg font-medium text-canvas-white">Active Repositories</h2>
      </div>
      
      <div className="flex flex-col gap-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl glass-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
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
          repositories.map((repo, index) => (
            <div 
              key={repo._id || repo.id} 
              className={`p-4 rounded-xl glass-surface flex items-center justify-between transition-all duration-300 hover:border-muted-cyan/20 hover:shadow-[0_0_15px_rgba(88,166,255,0.08)] hover:-translate-y-0.5 animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
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
