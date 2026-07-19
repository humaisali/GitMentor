import { useState, useEffect } from 'react';
import { RefreshCcw, Activity, GitBranch, Star, ExternalLink, Trophy, Lock } from 'lucide-react';
import { BADGES } from '../utils/badges';
import { ContributionCalendarWidget } from '../components/widgets/ContributionCalendarWidget';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      const token = localStorage.getItem('gitmentor_token');
      const res = await fetch(`http://localhost:5000/api/analytics/profile${forceRefresh ? '?forceRefresh=true' : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <header className="flex justify-between items-end mb-2 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Analytics</h1>
          <p className="text-muted-steel mt-1 font-mono text-sm">Deep dive into your developer impact and streaks.</p>
        </div>
        <button 
          onClick={() => fetchProfile(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-muted-surface hover:bg-whisper border border-whisper rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-auto pr-2 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min">
            
            {/* ROW 1: Heatmap (Span 2) & Streaks (Span 1) */}
            <div className="xl:col-span-2 md:col-span-2 col-span-1">
              <ContributionCalendarWidget initialData={data.contributions} />
            </div>

            <Card className="xl:col-span-1 md:col-span-2 col-span-1 p-6 flex flex-col justify-between h-full">
              <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-6 flex items-center gap-2">
                <Activity size={20} className="text-red-500" /> Contribution Streaks
              </h2>
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/30 transition-colors flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-bold text-muted-cyan mb-1">{data.contributions.currentStreak} <span className="text-sm">days</span></div>
                  <div className="text-muted-steel text-xs font-mono">CURRENT</div>
                </div>
                <div className="bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/30 transition-colors flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-bold text-canvas-white mb-1">{data.contributions.longestStreak} <span className="text-sm">days</span></div>
                  <div className="text-muted-steel text-xs font-mono">LONGEST</div>
                </div>
              </div>
            </Card>

            {/* ROW 2: Languages (Span 1) & Impact (Span 2) */}
            <Card className="xl:col-span-1 md:col-span-2 col-span-1 p-6 h-full flex flex-col">
              <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-6 flex items-center gap-2 shrink-0">
                <GitBranch size={20} className="text-emerald-500" /> Top Languages
              </h2>
              <div className="flex h-3 rounded-full overflow-hidden mb-6 bg-charcoal-base border border-whisper shrink-0">
                {data.languages.map(lang => (
                  <div 
                    key={lang.name} 
                    style={{ width: `${lang.percentage}%`, backgroundColor: lang.color || '#A1A1AA' }}
                    className="h-full transition-all hover:opacity-80"
                    title={`${lang.name} ${lang.percentage}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 flex-1 content-start">
                {data.languages.map(lang => (
                  <div key={lang.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lang.color || '#A1A1AA' }} />
                    <span className="text-sm text-canvas-white font-medium">{lang.name}</span>
                    <span className="text-xs text-muted-steel font-mono">{lang.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="xl:col-span-2 md:col-span-2 col-span-1 p-6 flex flex-col justify-between h-full">
              <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-6 flex items-center gap-2">
                <Star size={20} className="text-yellow-500" /> Community Impact
              </h2>
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/30 transition-colors flex flex-col justify-center">
                  <div className="text-muted-steel text-xs font-mono mb-1">STARS EARNED</div>
                  <div className="text-2xl font-semibold text-canvas-white">{data.overview.totalStars}</div>
                </div>
                <div className="bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/30 transition-colors flex flex-col justify-center">
                  <div className="text-muted-steel text-xs font-mono mb-1">TOTAL FORKS</div>
                  <div className="text-2xl font-semibold text-canvas-white">{data.overview.totalForks}</div>
                </div>
                <div className="bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/30 transition-colors flex flex-col justify-center">
                  <div className="text-muted-steel text-xs font-mono mb-1">FOLLOWERS</div>
                  <div className="text-2xl font-semibold text-canvas-white">{data.overview.followers}</div>
                </div>
                <div className="bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/30 transition-colors flex flex-col justify-center">
                  <div className="text-muted-steel text-xs font-mono mb-1">PRs / ISSUES</div>
                  <div className="text-2xl font-semibold text-canvas-white">{data.overview.pullRequests} / {data.overview.issues}</div>
                </div>
              </div>
            </Card>

            {/* ROW 3: Featured Repos & Trending Repos (50/50 split across full width) */}
            <div className="xl:col-span-3 md:col-span-2 col-span-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 h-full flex flex-col">
                 <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-4 shrink-0">Featured Repositories</h2>
                 <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
                   {data.featuredRepos.length > 0 ? data.featuredRepos.map(repo => (
                     <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer" className="block bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/50 transition-colors shrink-0">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-canvas-white text-sm flex items-center gap-1">{repo.name} <ExternalLink size={12} className="text-muted-steel"/></span>
                          <div className="flex items-center gap-3 text-xs text-muted-steel font-mono">
                            <span className="flex items-center gap-1"><Star size={12}/> {repo.stargazerCount}</span>
                            {repo.primaryLanguage && (
                              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: repo.primaryLanguage.color}}/> {repo.primaryLanguage.name}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-steel line-clamp-2">{repo.description || 'No description provided.'}</p>
                     </a>
                   )) : <div className="text-sm text-muted-steel">No pinned repositories.</div>}
                 </div>
              </Card>

              <Card className="p-6 h-full flex flex-col">
                 <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-4 shrink-0">Trending Repositories</h2>
                 <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
                   {data.trendingRepos.length > 0 ? data.trendingRepos.map(repo => (
                     <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer" className="block bg-charcoal-base p-4 rounded-lg border border-whisper hover:border-muted-cyan/50 transition-colors shrink-0">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-canvas-white text-sm flex items-center gap-1">{repo.name} <ExternalLink size={12} className="text-muted-steel"/></span>
                          <div className="flex items-center gap-3 text-xs text-muted-steel font-mono">
                            <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500"/> {repo.stargazerCount}</span>
                            {repo.primaryLanguage && (
                              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: repo.primaryLanguage.color}}/> {repo.primaryLanguage.name}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-steel line-clamp-2">{repo.description || 'No description provided.'}</p>
                     </a>
                   )) : <div className="text-sm text-muted-steel">No public repositories.</div>}
                 </div>
              </Card>
            </div>
            
            {/* ROW 4: Achievements Showcase */}
            <div className="xl:col-span-3 md:col-span-2 col-span-1">
              <Card className="p-8 h-full flex flex-col relative overflow-hidden bg-muted-surface border-none shadow-xl shadow-muted-cyan/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-muted-cyan/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
                
                <h2 className="text-2xl font-semibold text-canvas-white tracking-tight mb-2 flex items-center gap-3 relative z-10">
                  <Trophy size={24} className="text-muted-cyan" /> Achievements Showcase
                </h2>
                <p className="text-[15px] text-muted-steel mb-8 relative z-10 max-w-2xl">
                  Unlock special badges by maintaining streaks, writing multi-language code, and engaging with the community.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {BADGES.map(badge => {
                    const isUnlocked = data.unlockedAchievements && data.unlockedAchievements.find(a => a.badgeId === badge.id);
                    const Icon = badge.icon;
                    return (
                      <div key={badge.id} className={`flex gap-5 p-6 rounded-2xl border transition-all ${isUnlocked ? 'bg-charcoal-base border-muted-cyan/30 ' + badge.glow : 'bg-charcoal-base/40 border-whisper/40 opacity-60 grayscale'}`}>
                        <div className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center border ${isUnlocked ? 'bg-surface-dim border-muted-cyan/50 ' + badge.color : 'bg-surface-dim border-whisper/50 text-muted-steel'}`}>
                          {isUnlocked ? <Icon size={26} /> : <Lock size={22} />}
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className={`font-semibold text-lg mb-1 ${isUnlocked ? 'text-canvas-white' : 'text-muted-steel'}`}>{badge.title}</h4>
                          <p className="text-sm text-muted-steel leading-relaxed mb-3">{badge.description}</p>
                          {isUnlocked && (
                            <div className="inline-block px-2.5 py-1 bg-surface-dim border border-whisper/50 rounded-full text-[11px] font-mono text-muted-cyan self-start">
                              UNLOCKED: {new Date(isUnlocked.unlockedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
            
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-steel mt-20">Unable to load analytics.</div>
      )}
    </div>
  );
};

export default Analytics;
