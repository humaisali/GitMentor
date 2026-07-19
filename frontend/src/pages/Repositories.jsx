import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { RefreshCcw, GitBranch, Star, GitFork, Plus, Check, ExternalLink, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/repositories';

const Repositories = () => {
  const [activeTab, setActiveTab] = useState('github');
  const [githubRepos, setGithubRepos] = useState([]);
  const [trackedRepos, setTrackedRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingIds, setTrackingIds] = useState(new Set());
  const navigate = useNavigate();

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ghRes, trRes] = await Promise.all([
        fetch(`${API_BASE}/github`, { headers }),
        fetch(`${API_BASE}/tracked`, { headers }),
      ]);

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        setGithubRepos(Array.isArray(ghData) ? ghData : []);
      }

      if (trRes.ok) {
        const trData = await trRes.json();
        setTrackedRepos(Array.isArray(trData) ? trData : []);
        setTrackingIds(new Set(trData.map(r => r.githubRepoId)));
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/github/refresh`, { headers });
      if (res.ok) {
        const ghData = await res.json();
        setGithubRepos(Array.isArray(ghData) ? ghData : []);
      }
    } catch (error) {
      console.error('Error refreshing repositories:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTrack = async (repo) => {
    try {
      const res = await fetch(`${API_BASE}/track`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubRepoId: repo.githubRepoId,
          name: repo.name,
          fullName: repo.fullName,
          defaultBranch: repo.defaultBranch,
        }),
      });

      if (res.ok) {
        const newTracked = await res.json();
        setTrackedRepos(prev => [newTracked, ...prev]);
        setTrackingIds(prev => new Set(prev).add(repo.githubRepoId));
      }
    } catch (error) {
      console.error('Error tracking repository:', error);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const repos = activeTab === 'github' ? githubRepos : trackedRepos;

  return (
    <div className="flex flex-col gap-6 h-full">
      <header className="shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Repositories</h1>
          <p className="text-muted-steel mt-1 font-mono text-sm">Your connected GitHub repositories.</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Sync GitHub'}
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-whisper shrink-0">
        <button
          onClick={() => setActiveTab('github')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'github'
              ? 'border-muted-cyan text-muted-cyan'
              : 'border-transparent text-muted-steel hover:text-canvas-white'
          }`}
        >
          GitHub Repos
        </button>
        <button
          onClick={() => setActiveTab('tracked')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'tracked'
              ? 'border-muted-cyan text-muted-cyan'
              : 'border-transparent text-muted-steel hover:text-canvas-white'
          }`}
        >
          Tracked ({trackedRepos.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto space-y-3 pb-6">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <div className="flex gap-4 mt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))
        ) : repos.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-steel text-sm">
            {activeTab === 'github' ? 'No GitHub repositories found.' : 'No tracked repositories yet. Go to GitHub Repos to start tracking.'}
          </div>
        ) : (
          repos.map(repo => (
            <RepoCard
              key={repo.githubRepoId || repo._id}
              repo={repo}
              isTracked={trackingIds.has(repo.githubRepoId)}
              showTrackButton={activeTab === 'github'}
              onTrack={handleTrack}
              formatDate={formatDate}
              onViewInsights={() => navigate(`/repositories/${repo._id}`, { state: { repo } })}
            />
          ))
        )}
      </div>
    </div>
  );
};

const RepoCard = ({ repo, isTracked, showTrackButton, onTrack, formatDate, onViewInsights }) => {
  // Normalize between GitHub API shape and our DB shape
  const name = repo.name;
  const fullName = repo.fullName || repo.fullName;
  const language = repo.language || 'Unknown';
  const stars = repo.stars ?? 0;
  const forks = repo.forks ?? 0;
  const lastPushed = repo.lastPushed || repo.updatedAt;
  const htmlUrl = repo.htmlUrl || `https://github.com/${fullName}`;
  const isPrivate = repo.isPrivate || false;

  return (
    <Card className="p-5 group transition-colors hover:border-muted-steel/30">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-canvas-white truncate">{name}</h3>
            {isPrivate && <Badge variant="default" className="text-[10px]">PRIVATE</Badge>}
          </div>

          <p className="text-xs font-mono text-muted-steel mb-3">{fullName}</p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-muted-cyan"></span>
              <span className="text-xs text-muted-steel">{language}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-steel">
              <Star size={13} />
              <span className="text-xs">{stars}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-steel">
              <GitFork size={13} />
              <span className="text-xs">{forks}</span>
            </div>
            {lastPushed && (
              <span className="text-xs text-muted-steel font-mono">
                Updated {formatDate(lastPushed)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <a href={htmlUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <ExternalLink size={14} />
            </Button>
          </a>

          {showTrackButton ? (
            isTracked ? (
              <Button variant="ghost" className="h-8 gap-1.5 text-xs px-3 text-muted-cyan cursor-default" disabled>
                <Check size={14} />
                Tracked
              </Button>
            ) : (
              <Button variant="primary" className="h-8 gap-1.5 text-xs px-3" onClick={() => onTrack(repo)}>
                <Plus size={14} />
                Track
              </Button>
            )
          ) : (
            <Button variant="secondary" className="h-8 gap-1.5 text-xs px-3" onClick={onViewInsights}>
              AI Insights
              <ChevronRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Repositories;
