import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Brain,
  Building2,
  ChevronDown,
  CheckCircle2,
  Code2,
  Container,
  Database,
  FileText,
  Gauge,
  GitPullRequest,
  Layers,
  Lightbulb,
  ListChecks,
  Map,
  Monitor,
  Network,
  RefreshCcw,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube,
  TrendingUp,
  Zap,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const CAREER_TRACK_OPTIONS = [
  { id: 'frontend-developer', label: 'Frontend Developer' },
  { id: 'backend-developer', label: 'Backend Developer' },
  { id: 'full-stack-developer', label: 'Full-Stack Developer' },
  { id: 'ai-app-developer', label: 'AI App Developer' },
  { id: 'devops-beginner', label: 'DevOps Beginner' },
  { id: 'open-source-contributor', label: 'Open Source Contributor' },
];

const CATEGORY_META = {
  frontend: { icon: Monitor, tone: 'text-sky-400', surface: 'bg-sky-500/10 border-sky-500/20', bar: 'from-sky-500 to-cyan-400' },
  backend: { icon: Server, tone: 'text-emerald-400', surface: 'bg-emerald-500/10 border-emerald-500/20', bar: 'from-emerald-500 to-teal-400' },
  databases: { icon: Database, tone: 'text-violet-400', surface: 'bg-violet-500/10 border-violet-500/20', bar: 'from-violet-500 to-indigo-400' },
  'api-design': { icon: Network, tone: 'text-cyan-400', surface: 'bg-cyan-500/10 border-cyan-500/20', bar: 'from-cyan-500 to-sky-400' },
  'auth-security': { icon: ShieldCheck, tone: 'text-rose-400', surface: 'bg-rose-500/10 border-rose-500/20', bar: 'from-rose-500 to-red-400' },
  testing: { icon: TestTube, tone: 'text-amber-400', surface: 'bg-amber-500/10 border-amber-500/20', bar: 'from-amber-500 to-yellow-400' },
  deployment: { icon: Rocket, tone: 'text-fuchsia-400', surface: 'bg-fuchsia-500/10 border-fuchsia-500/20', bar: 'from-fuchsia-500 to-rose-400' },
  architecture: { icon: Building2, tone: 'text-teal-400', surface: 'bg-teal-500/10 border-teal-500/20', bar: 'from-teal-500 to-emerald-400' },
  devops: { icon: Container, tone: 'text-orange-400', surface: 'bg-orange-500/10 border-orange-500/20', bar: 'from-orange-500 to-amber-400' },
  'code-quality': { icon: Sparkles, tone: 'text-lime-400', surface: 'bg-lime-500/10 border-lime-500/20', bar: 'from-lime-500 to-emerald-400' },
  documentation: { icon: FileText, tone: 'text-indigo-400', surface: 'bg-indigo-500/10 border-indigo-500/20', bar: 'from-indigo-500 to-sky-400' },
  'open-source': { icon: GitPullRequest, tone: 'text-pink-400', surface: 'bg-pink-500/10 border-pink-500/20', bar: 'from-pink-500 to-fuchsia-400' },
  'product-thinking': { icon: Gauge, tone: 'text-green-400', surface: 'bg-green-500/10 border-green-500/20', bar: 'from-green-500 to-lime-400' },
};

const LANGUAGE_COLORS = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3776AB',
  Java: '#ED8B00',
  'C#': '#239120',
  'C++': '#00599C',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Ruby: '#CC342D',
  PHP: '#777BB4',
  Swift: '#FA7343',
  Kotlin: '#7F52FF',
  HTML: '#E34F26',
  CSS: '#1572B6',
  Shell: '#89E051',
  Dart: '#0175C2',
};

const DEFAULT_CATEGORY_META = {
  icon: Code2,
  tone: 'text-muted-cyan',
  surface: 'bg-muted-cyan/10 border-muted-cyan/20',
  bar: 'from-muted-cyan to-blue-400',
};

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

const formatDate = (date) => {
  if (!date) return 'Not assessed';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getLevelVariant = (level) => {
  switch (level) {
    case 'ADVANCED':
      return 'success';
    case 'INTERMEDIATE':
      return 'primary';
    case 'BEGINNER':
      return 'warning';
    default:
      return 'default';
  }
};

const getProficiencyWidth = (level) => {
  if (level === 'ADVANCED') return 90;
  if (level === 'INTERMEDIATE') return 62;
  return 34;
};

const getLanguageColor = (name) => LANGUAGE_COLORS[name] || '#94A3B8';

const ScoreRing = ({ score, size = 144, strokeWidth = 10 }) => {
  const value = clampScore(score);
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const stroke = animatedScore >= 70 ? '#10B981' : animatedScore >= 45 ? '#06B6D4' : '#F59E0B';

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(value), 120);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums text-canvas-white">{animatedScore}</span>
        <span className="mt-0.5 text-[11px] font-mono text-muted-steel">overall</span>
      </div>
    </div>
  );
};

const ProgressBar = ({ score, gradient = 'from-muted-cyan to-blue-400' }) => (
  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
    <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${clampScore(score)}%` }} />
  </div>
);

const CareerTrackSelect = ({ value, onChange, disabled = false }) => (
  <label className="flex min-w-[220px] flex-col gap-1.5">
    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-steel">Target role</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="glass-surface h-10 rounded-lg bg-bg-base/80 px-3 text-sm text-canvas-white outline-none transition-colors focus:border-muted-cyan/30 disabled:opacity-50"
    >
      {CAREER_TRACK_OPTIONS.map((option) => (
        <option key={option.id} value={option.id} className="bg-bg-base text-canvas-white">
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const ConfidencePill = ({ value }) => {
  const score = clampScore(value ?? 50);
  const tone = score >= 70
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
    : score >= 45
      ? 'border-muted-cyan/20 bg-muted-cyan/10 text-muted-cyan'
      : 'border-amber-500/20 bg-amber-500/10 text-amber-400';

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-mono ${tone}`}>{score}% confidence</span>;
};

const DeltaPill = ({ value, compact = false }) => {
  const delta = Math.round(Number(value) || 0);
  const copy = delta === 0 ? 'no change' : `${delta > 0 ? '+' : ''}${delta}`;
  const tone = delta > 0
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
    : delta < 0
      ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
      : 'border-white/[0.08] bg-white/[0.04] text-muted-steel';

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-mono ${tone}`}>
      {compact || delta === 0 ? copy : `${copy} since last`}
    </span>
  );
};

const SectionTitle = ({ icon: Icon, title, aside }) => (
  <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
        <Icon size={16} className="text-muted-cyan" />
      </div>
      <h2 className="truncate text-base font-medium tracking-tight text-canvas-white">{title}</h2>
    </div>
    {aside}
  </div>
);

const MetricTile = ({ label, value, icon: Icon, tone = 'text-canvas-white' }) => (
  <div className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-3 xl:px-4">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-steel">
      <Icon size={13} className="shrink-0" />
      <span>{label}</span>
    </div>
    <div className={`text-base font-semibold leading-snug tabular-nums sm:text-lg ${tone}`}>{value}</div>
  </div>
);

const EmptyState = ({ onAssess, assessing, targetRole, onTargetRoleChange }) => (
  <div className="flex flex-1 items-center justify-center py-20">
    <Card hover={false} className="w-full max-w-xl p-8">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-muted-cyan/20 bg-muted-cyan/10">
        <Brain size={26} className="text-muted-cyan" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-canvas-white">Create your skill profile</h2>
      <p className="mb-6 max-w-lg text-sm leading-relaxed text-muted-steel">
        GitMentor will analyze your repositories, progress events, and career target to build a skill profile with strengths, gaps, readiness, and suggested next moves.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <CareerTrackSelect value={targetRole} onChange={onTargetRoleChange} disabled={assessing} />
        <Button onClick={onAssess} disabled={assessing} className="h-10 gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCcw size={16} className={assessing ? 'animate-spin' : ''} />
          {assessing ? 'Analyzing' : 'Analyze skills'}
        </Button>
      </div>
    </Card>
  </div>
);

const EmptyPanel = ({ children }) => (
  <div className="px-5 py-8 text-center text-sm text-muted-steel">{children}</div>
);

const TagList = ({ items = [], variant = 'default', limit = 3 }) => {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, limit).map((item) => (
        <Badge key={item} variant={variant} className="max-w-[180px] overflow-hidden text-ellipsis text-[10px] sm:max-w-[240px]">
          {item}
        </Badge>
      ))}
    </div>
  );
};

const BulletList = ({ items = [], limit = 4, dotClassName = 'bg-amber-400' }) => {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.slice(0, limit).map((item) => (
        <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-steel">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} />
          <span className="break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const SkillRow = ({ category }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const meta = CATEGORY_META[category.slug] || DEFAULT_CATEGORY_META;
  const Icon = meta.icon;
  const score = clampScore(category.score);
  const priority = (category.gaps || []).length > 0 && score < 70;

  return (
    <div className="border-t border-white/[0.06] px-4 py-5 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${meta.surface}`}>
            <Icon size={18} className={meta.tone} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words font-medium text-canvas-white">{category.name}</h3>
              {priority && <Badge variant="warning" className="text-[10px]">focus</Badge>}
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-steel">{category.description || 'No assessment note available.'}</p>
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              aria-expanded={detailsOpen}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-cyan transition-colors hover:text-canvas-white"
            >
              Details
              <ChevronDown size={14} className={`transition-transform duration-200 ${detailsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="w-full rounded-lg border border-white/[0.06] bg-white/[0.025] p-3 lg:w-[240px] lg:shrink-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-2xl font-semibold tabular-nums text-canvas-white">{score}</span>
            <Badge variant={getLevelVariant(category.level)} className="text-[10px]">{category.level || 'UNKNOWN'}</Badge>
          </div>
          <ProgressBar score={score} gradient={meta.bar} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ConfidencePill value={category.confidence} />
            <DeltaPill value={category.scoreDelta} compact />
          </div>
        </div>
      </div>

      {detailsOpen && (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-steel">Strengths</p>
            <BulletList items={category.strengths || []} limit={4} dotClassName="bg-emerald-400" />
            {!(category.strengths || []).length && <p className="text-xs text-muted-steel">Needs more evidence.</p>}
          </div>

          <div className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-steel">Gaps and evidence</p>
            <BulletList items={category.gaps || []} limit={4} />
            <div className="mt-2 space-y-1.5">
              {(category.evidence || []).slice(0, 2).map((item, index) => (
                <p key={`${item.label}-${index}`} className="break-words text-xs leading-relaxed text-muted-steel">
                  <span className="text-canvas-white/80">{item.label}</span>
                  {item.detail ? <span> - {item.detail}</span> : null}
                </p>
              ))}
              {(category.recommendedActions || []).length > 0 && (
                <p className="break-words text-xs leading-relaxed text-muted-cyan">{category.recommendedActions[0]}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActionItem = ({ action, index }) => (
  <div className="border-t border-white/[0.06] px-5 py-4 first:border-t-0">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-muted-cyan/20 bg-muted-cyan/10 text-xs font-semibold text-muted-cyan">
          {index + 1}
        </span>
        <h3 className="min-w-0 text-sm font-medium leading-snug text-canvas-white">{action.title}</h3>
      </div>
      <Badge variant={action.impact === 'HIGH' ? 'error' : action.impact === 'LOW' ? 'default' : 'primary'} className="text-[10px]">
        {action.impact || 'MEDIUM'}
      </Badge>
    </div>
    <p className="pl-9 text-sm leading-relaxed text-muted-steel">{action.description}</p>
  </div>
);

const ReadinessItem = ({ item }) => (
  <div className="border-t border-white/[0.06] px-5 py-4 first:border-t-0">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="min-w-0 text-sm font-medium text-canvas-white">{item.track}</h3>
      <span className="text-sm font-mono tabular-nums text-muted-cyan">{clampScore(item.score)}%</span>
    </div>
    <ProgressBar score={item.score} gradient="from-emerald-500 to-cyan-400" />
    {item.summary && <p className="mt-2 text-xs leading-relaxed text-muted-steel">{item.summary}</p>}
  </div>
);

const LanguageItem = ({ language }) => (
  <div className="min-w-0 border-t border-white/[0.06] px-5 py-[21px] first:border-t-0 md:[&:nth-child(2)]:border-t-0 xl:[&:nth-child(2)]:border-t-0">
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getLanguageColor(language.name) }} />
        <span className="truncate text-sm font-medium text-canvas-white">{language.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] font-mono text-muted-steel">{language.projectCount || 0} repos</span>
        <Badge variant={getLevelVariant(language.proficiency)} className="text-[10px]">{language.proficiency || 'BEGINNER'}</Badge>
      </div>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
      <div
        className="h-full rounded-full"
        style={{ width: `${getProficiencyWidth(language.proficiency)}%`, backgroundColor: getLanguageColor(language.name) }}
      />
    </div>
  </div>
);

const RepositoryItem = ({ repo }) => (
  <div className="border-t border-white/[0.06] px-5 py-4 first:border-t-0">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-canvas-white">{repo.repoName}</h3>
        <div className="mt-1">
          <ConfidencePill value={repo.confidence} />
        </div>
      </div>
      {repo.url && (
        <a href={repo.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-cyan transition-colors hover:text-canvas-white">
          View <ArrowUpRight size={12} />
        </a>
      )}
    </div>
    <TagList items={repo.detectedSkills || []} limit={6} />
    {(repo.missingSignals || []).length > 0 && (
      <div className="mt-3 space-y-1">
        {repo.missingSignals.slice(0, 2).map((signal) => (
          <p key={signal} className="text-xs leading-relaxed text-amber-400/90">{signal}</p>
        ))}
      </div>
    )}
  </div>
);

const ProgressItem = ({ event }) => (
  <div className="border-t border-white/[0.06] px-5 py-4 first:border-t-0">
    <div className="mb-1 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-400">
          +{event.impactScore || 1}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-medium leading-snug text-canvas-white">{event.title}</h3>
          {event.description && <p className="mt-1 text-xs leading-relaxed text-muted-steel">{event.description}</p>}
        </div>
      </div>
      <Badge variant="default" className="text-[10px]">{event.categoryName || 'Skill'}</Badge>
    </div>
    {event.createdAt && <p className="pl-10 text-[10px] font-mono text-muted-steel">{formatDate(event.createdAt)}</p>}
  </div>
);

const HistoryItem = ({ item }) => (
  <div className="border-t border-white/[0.06] px-5 py-4 first:border-t-0">
    <div className="mb-2 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-canvas-white">{item.overallLevel}</p>
        <p className="text-[11px] font-mono text-muted-steel">{formatDate(item.assessedAt)}</p>
      </div>
      <div className="text-right">
        <p className="text-xl font-semibold tabular-nums text-muted-cyan">{clampScore(item.overallScore)}</p>
        <DeltaPill value={item.scoreDelta} compact />
      </div>
    </div>
    <ProgressBar score={item.overallScore} />
  </div>
);

const SkillProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState(null);
  const [targetRole, setTargetRole] = useState('full-stack-developer');

  const token = localStorage.getItem('gitmentor_token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/skills/profile`, { headers });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setTargetRole(data.targetRole || 'full-stack-developer');
      } else if (res.status === 404) {
        setProfile(null);
      } else {
        throw new Error('Failed to load skill profile');
      }
    } catch (err) {
      console.error('Error fetching skill profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const runAssessment = async () => {
    try {
      setAssessing(true);
      setError(null);
      const res = await fetch(`${API_BASE}/skills/assess`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetRole }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Assessment failed');
      }
    } catch (err) {
      console.error('Error running assessment:', err);
      setError(err.message);
    } finally {
      setAssessing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const sortedCategories = useMemo(() => {
    return [...(profile?.categories || [])].sort((a, b) => {
      return clampScore(b.score) - clampScore(a.score);
    });
  }, [profile]);

  const focusCategories = sortedCategories.filter((category) => clampScore(category.score) < 70).slice(0, 3);
  const topCategories = [...(profile?.categories || [])].sort((a, b) => clampScore(b.score) - clampScore(a.score)).slice(0, 3);
  const selectedTrackLabel = CAREER_TRACK_OPTIONS.find((option) => option.id === targetRole)?.label || 'Full-Stack Developer';

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <Skeleton className="mb-3 h-9 w-64" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-72" />
        </header>
        <Skeleton className="h-56 w-full" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">
              Skill <span className="bg-gradient-to-r from-muted-cyan to-blue-400 bg-clip-text text-transparent">Profile</span>
            </h1>
            <p className="mt-1 text-sm font-mono text-muted-steel">AI-powered skill assessment and gap analysis.</p>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <EmptyState onAssess={runAssessment} assessing={assessing} targetRole={targetRole} onTargetRoleChange={setTargetRole} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">
            Skill <span className="bg-gradient-to-r from-muted-cyan to-blue-400 bg-clip-text text-transparent">Profile</span>
          </h1>
          <p className="mt-1 text-sm font-mono text-muted-steel">AI-powered skill assessment and gap analysis.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <CareerTrackSelect value={targetRole} onChange={setTargetRole} disabled={assessing} />
          <Button onClick={runAssessment} disabled={assessing} variant="secondary" className="h-10 gap-2 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCcw size={16} className={assessing ? 'animate-spin' : ''} />
            {assessing ? 'Re-assessing' : 'Re-assess'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card hover={false} className="min-w-0 p-6">
          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div className="flex justify-center lg:justify-start">
                <ScoreRing score={profile.overallScore} />
              </div>
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge variant={getLevelVariant(profile.overallLevel)}>{profile.overallLevel}</Badge>
                  <ConfidencePill value={profile.confidence} />
                  <DeltaPill value={profile.scoreDelta} />
                </div>
                <h2 className="mb-3 text-2xl font-semibold tracking-tight text-canvas-white">{selectedTrackLabel} readiness snapshot</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-steel">{profile.summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Repos analyzed" value={profile.repositoriesAnalyzed || 0} icon={Code2} />
              <MetricTile label="Categories" value={profile.categories?.length || 0} icon={Layers} />
              <MetricTile label="Last assessed" value={formatDate(profile.assessedAt)} icon={Activity} />
              <MetricTile label="Target role" value={selectedTrackLabel} icon={Target} tone="text-muted-cyan" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <SectionTitle icon={CheckCircle2} title="Current Standing" />
          <div className="grid grid-cols-1 divide-y divide-white/[0.06]">
            <div className="px-5 py-4">
              <p className="mb-3 text-[10px] font-mono uppercase tracking-wider text-muted-steel">Strongest signals</p>
              <div className="space-y-3">
                {topCategories.map((category) => (
                  <div key={category.slug} className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-canvas-white">{category.name}</span>
                    <span className="font-mono text-sm tabular-nums text-emerald-400">{clampScore(category.score)}</span>
                  </div>
                ))}
                {!topCategories.length && <p className="text-sm text-muted-steel">No strengths available yet.</p>}
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="mb-3 text-[10px] font-mono uppercase tracking-wider text-muted-steel">Highest leverage focus</p>
              <div className="space-y-3">
                {focusCategories.map((category) => (
                  <div key={category.slug} className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-canvas-white">{category.name}</span>
                    <span className="font-mono text-sm tabular-nums text-amber-400">{clampScore(category.score)}</span>
                  </div>
                ))}
                {!focusCategories.length && <p className="text-sm text-muted-steel">No major gap detected.</p>}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 overflow-hidden">
            <SectionTitle
              icon={BarChart3}
              title="Skill Matrix"
              aside={<span className="hidden text-[11px] font-mono text-muted-steel sm:inline">Sorted by score</span>}
            />
            {sortedCategories.length > 0 ? (
              <div className="scroll-panel max-h-[570px] overflow-y-auto overscroll-contain pr-1">
                {sortedCategories.map((category) => <SkillRow key={category.slug} category={category} />)}
              </div>
            ) : (
              <EmptyPanel>No skill categories available.</EmptyPanel>
            )}
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <SectionTitle icon={Code2} title="Languages" />
            {profile.topLanguages?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2">
                {profile.topLanguages.map((language) => <LanguageItem key={language.name} language={language} />)}
              </div>
            ) : (
              <EmptyPanel>No language data available.</EmptyPanel>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 overflow-hidden">
            <SectionTitle icon={Lightbulb} title="Priority Actions" />
            {profile.nextBestActions?.length > 0 ? (
              profile.nextBestActions.slice(0, 4).map((action, index) => <ActionItem key={`${action.title}-${index}`} action={action} index={index} />)
            ) : (
              <EmptyPanel>No priority actions generated.</EmptyPanel>
            )}
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <SectionTitle icon={Gauge} title="Role Readiness" />
            {profile.readinessScores?.length > 0 ? (
              profile.readinessScores.slice(0, 4).map((item) => <ReadinessItem key={item.track} item={item} />)
            ) : (
              <EmptyPanel>No readiness scores available.</EmptyPanel>
            )}
          </Card>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 overflow-hidden">
          <SectionTitle icon={Map} title="Repository Evidence" />
          {profile.repoSkillMap?.length > 0 ? (
            <div className="scroll-panel max-h-[480px] overflow-y-auto overscroll-contain">
              {profile.repoSkillMap.slice(0, 8).map((repo, index) => <RepositoryItem key={`${repo.repoName}-${index}`} repo={repo} />)}
            </div>
          ) : (
            <EmptyPanel>No repository skill evidence available.</EmptyPanel>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <SectionTitle icon={Zap} title="Growth Recommendations" />
          {profile.recommendations?.length > 0 ? (
            <div className="scroll-panel max-h-[460px] overflow-y-auto overscroll-contain">
              {profile.recommendations.slice(0, 6).map((recommendation, index) => (
                <div key={`${recommendation}-${index}`} className="border-t border-white/[0.06] px-5 py-4 first:border-t-0">
                  <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg border border-muted-cyan/20 bg-muted-cyan/10 text-xs font-semibold text-muted-cyan">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-steel">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel>No growth recommendations available.</EmptyPanel>
          )}
        </Card>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 overflow-hidden">
          <SectionTitle icon={ListChecks} title="Recent Skill Progress" />
          {profile.recentProgressEvents?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {profile.recentProgressEvents.slice(0, 6).map((event, index) => (
                <ProgressItem key={`${event.title}-${index}`} event={event} />
              ))}
            </div>
          ) : (
            <EmptyPanel>No recent skill progress has been recorded.</EmptyPanel>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <SectionTitle icon={TrendingUp} title="Assessment History" />
          {profile.history?.length > 0 ? (
            profile.history.slice(-5).reverse().map((item, index) => <HistoryItem key={`${item.assessedAt}-${index}`} item={item} />)
          ) : (
            <EmptyPanel>No previous assessments yet.</EmptyPanel>
          )}
        </Card>
      </section>
    </div>
  );
};

export default SkillProfile;
